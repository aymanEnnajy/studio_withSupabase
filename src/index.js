import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sign } from 'jsonwebtoken'
import { hash, compare } from 'bcryptjs'
import { authMiddleware } from './middleware/auth'
import { createClient } from '@supabase/supabase-js'

import { serveStatic } from 'hono/cloudflare-workers'
import manifest from '__STATIC_CONTENT_MANIFEST'

const app = new Hono()

app.onError((err, c) => {
    console.error('Runtime Error:', err)
    return c.text(`Internal Server Error: ${err.message}\n${err.stack}`, 500)
})

app.use('/*', cors())

// Supabase Client Helper
const getSupabase = (c) => {
    return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)
}

// Auth key for JWT
const getJwtSecret = (c) => c.env.JWT_SECRET

app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Register
app.post('/api/auth/register', async (c) => {
    const { username, email, password } = await c.req.json();

    if (!username || !email || !password) {
        return c.json({ error: 'Missing fields' }, 400);
    }

    const supabase = getSupabase(c);

    // Check if user exists
    const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (existing) {
        return c.json({ error: 'Email already exists' }, 409);
    }

    const hashedPassword = await hash(password, 10);

    try {
        const { error: insertError } = await supabase
            .from('users')
            .insert([{ username, email, password: hashedPassword }]);

        if (insertError) throw insertError;

        return c.json({ message: 'User registered successfully', success: true }, 201);
    } catch (e) {
        return c.json({ error: 'Registration failed', details: e.message }, 500);
    }
});

// Login
app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json();

    if (!email || !password) {
        return c.json({ error: 'Missing credentials' }, 400);
    }

    const supabase = getSupabase(c);

    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (fetchError || !user) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = sign({ id: user.id, email: user.email, role: user.role }, c.env.JWT_SECRET, { expiresIn: '24h' });

    // Remove password from response
    delete user.password;

    return c.json({
        message: 'Login successful',
        token,
        user
    });
});

// Get Current User
app.get('/api/auth/me', authMiddleware, async (c) => {
    const payload = c.get('user');
    const supabase = getSupabase(c);

    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, username, email, role, created_at')
        .eq('id', payload.id)
        .single();

    if (fetchError || !user) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
});

// Get My Studios (For Dashboard)
app.get('/api/auth/my-items', authMiddleware, async (c) => {
    const user = c.get('user');
    const supabase = getSupabase(c);

    try {
        const { data, error } = await supabase
            .from('studios')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return c.json(data);
    } catch (e) {
        return c.json({ error: 'Failed to fetch your studios', details: e.message }, 500);
    }
});

// Test DB connection
app.get('/api/test-db', async (c) => {
    const supabase = getSupabase(c);
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) throw error;
        return c.json({ message: 'Database connection successful', data: data });
    } catch (e) {
        return c.json({ error: 'Database connection failed', details: e.message }, 500);
    }
});

// --- Studios API ---

// List Studios (with filters)
app.get('/api/items', async (c) => {
    const { category, city, status, priceMax, search } = c.req.query();
    const supabase = getSupabase(c);

    let query = supabase.from('studios').select('*');

    if (category && category !== 'all') {
        query = query.ilike('services', `%${category}%`);
    }

    if (city && city !== 'all') {
        query = query.eq('city', city);
    }

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (priceMax) {
        query = query.lte('price_per_hour', priceMax);
    }

    if (search) {
        query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    try {
        const today = new Date().toISOString().split('T')[0];

        // Auto-update expired MANUAL reservations
        try {
            await supabase
                .from('studios')
                .update({ status: 'available', reserved_until: null })
                .eq('status', 'reserved')
                .lt('reserved_until', today)
                .not('reserved_until', 'is', null);
        } catch (updateError) {
            console.log('Auto-update skipped:', updateError.message);
        }

        const { data: results, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        // Dynamically calculate status based on current bookings
        const enrichedResults = await Promise.all(results.map(async (studio) => {
            if (studio.status === 'reserved') return studio; // Already reserved by owner

            const { data: currentBooking } = await supabase
                .from('bookings')
                .select('id')
                .eq('item_id', studio.id)
                .neq('status', 'cancelled')
                .lte('date', today)
                .gte('end_date', today)
                .single();

            if (currentBooking) {
                return { ...studio, status: 'reserved' };
            }
            return studio;
        }));

        return c.json(enrichedResults);
    } catch (e) {
        return c.json({ error: 'Failed to fetch studios', details: e.message }, 500);
    }
});

// Get Studio Details
app.get('/api/items/:id', async (c) => {
    const id = c.req.param('id')?.trim();
    const supabase = getSupabase(c);

    if (!id) {
        return c.json({ error: 'ID is required' }, 400);
    }

    try {
        let studio;
        const numericId = parseInt(id);

        if (!isNaN(numericId)) {
            const { data } = await supabase.from('studios').select('*').eq('id', numericId).single();
            studio = data;
        } else {
            const { data } = await supabase.from('studios').select('*').eq('id', id).single();
            studio = data;
        }

        if (!studio) {
            return c.json({ error: 'Studio not found' }, 404);
        }

        // Dynamic status for single studio
        const today = new Date().toISOString().split('T')[0];
        if (studio.status !== 'reserved') {
            const { data: currentBooking } = await supabase
                .from('bookings')
                .select('id')
                .eq('item_id', studio.id)
                .neq('status', 'cancelled')
                .lte('date', today)
                .gte('end_date', today)
                .single();

            if (currentBooking) {
                studio.status = 'reserved';
            }
        }

        return c.json(studio);
    } catch (e) {
        return c.json({ error: 'Failed to fetch studio', details: e.message }, 500);
    }
});

// Create Studio (Protected)
app.post('/api/items', authMiddleware, async (c) => {
    const user = c.get('user');
    const supabase = getSupabase(c);
    const { name, services, price, city, equipments, equipment, status, image, description, reservedUntil } = await c.req.json();

    if (!name || !price || !city) {
        return c.json({ error: 'Missing required fields' }, 400);
    }

    const servicesStr = Array.isArray(services) ? services.join(',') : (services || '');
    const equipmentsStr = Array.isArray(equipments || equipment) ? (equipments || equipment).join(',') : (equipments || equipment || '');

    try {
        const { data, error } = await supabase
            .from('studios')
            .insert([{
                name,
                services: servicesStr,
                price_per_hour: price,
                city,
                equipments: equipmentsStr,
                status: status || 'available',
                image,
                description: description || '',
                created_by: user.id,
                reserved_until: reservedUntil || null
            }])
            .select()
            .single();

        if (error) throw error;
        return c.json({ message: 'Studio created successfully', id: data.id }, 201);
    } catch (e) {
        return c.json({ error: 'Failed to create studio', details: e.message }, 500);
    }
});

// Update Studio (Protected)
app.put('/api/items/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const supabase = getSupabase(c);
    const updates = await c.req.json();

    const { data: studio } = await supabase.from('studios').select('created_by').eq('id', id).single();
    if (!studio) {
        return c.json({ error: 'Studio not found' }, 404);
    }
    if (studio.created_by !== user.id && user.role !== 'admin') {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    const updateData = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.city) updateData.city = updates.city;
    if (updates.price) updateData.price_per_hour = updates.price;
    if (updates.status) updateData.status = updates.status;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.services) {
        updateData.services = Array.isArray(updates.services) ? updates.services.join(',') : updates.services;
    }
    if (updates.equipments || updates.equipment) {
        const equipmentData = updates.equipments || updates.equipment;
        updateData.equipments = Array.isArray(equipmentData) ? equipmentData.join(',') : equipmentData;
    }
    if (updates.reservedUntil !== undefined) {
        updateData.reserved_until = updates.reservedUntil || null;
    }

    if (Object.keys(updateData).length === 0) return c.json({ message: 'No changes' });

    try {
        const { error } = await supabase.from('studios').update(updateData).eq('id', id);
        if (error) throw error;
        return c.json({ message: 'Studio updated successfully' });
    } catch (e) {
        return c.json({ error: 'Update failed', details: e.message }, 500);
    }
});

// Delete Studio (Protected)
app.delete('/api/items/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const supabase = getSupabase(c);

    const { data: studio } = await supabase.from('studios').select('created_by').eq('id', id).single();
    if (!studio) {
        return c.json({ error: 'Studio not found' }, 404);
    }
    if (studio.created_by !== user.id && user.role !== 'admin') {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    try {
        // Dependencies are handled by ON DELETE CASCADE in PostgreSQL schema but Supabase JS doesn't always trigger it if not configured in DB.
        // Actually, PostgreSQL CASCADE handles it perfectly at the DB level.
        const { error } = await supabase.from('studios').delete().eq('id', id);
        if (error) throw error;
        return c.json({ message: 'Studio deleted successfully' });
    } catch (e) {
        return c.json({ error: 'Delete failed', details: e.message }, 500);
    }
});

// --- Favorites API ---

// Add to Favorites
app.post('/api/favorites/:itemId', authMiddleware, async (c) => {
    const itemId = c.req.param('itemId');
    const user = c.get('user');
    const supabase = getSupabase(c);

    try {
        const { error } = await supabase.from('favorites').insert([{ user_id: user.id, studio_id: itemId }]);
        if (error) {
            if (error.code === '23505') return c.json({ message: 'Already in favorites' });
            throw error;
        }
        return c.json({ message: 'Added to favorites' });
    } catch (e) {
        return c.json({ error: 'Failed to add favorite', details: e.message }, 500);
    }
});

// Remove from Favorites
app.delete('/api/favorites/:itemId', authMiddleware, async (c) => {
    const itemId = c.req.param('itemId');
    const user = c.get('user');
    const supabase = getSupabase(c);

    try {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('studio_id', itemId);
        if (error) throw error;
        return c.json({ message: 'Removed from favorites' });
    } catch (e) {
        return c.json({ error: 'Failed to remove favorite', details: e.message }, 500);
    }
});

// List My Favorites
app.get('/api/favorites/my-favorites', authMiddleware, async (c) => {
    const user = c.get('user');
    const supabase = getSupabase(c);

    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('studios(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Flatten the result
        const flattened = data.map(f => f.studios);
        return c.json(flattened);
    } catch (e) {
        return c.json({ error: 'Failed to fetch favorites', details: e.message }, 500);
    }
});

// --- Bookings API ---

app.post('/api/bookings', authMiddleware, async (c) => {
    const { itemId, date, endDate } = await c.req.json();
    const user = c.get('user');
    const supabase = getSupabase(c);

    if (!itemId || !date) return c.json({ error: 'Studio ID and start date are required' }, 400);

    const finalEndDate = endDate || date;

    try {
        // 1. Check conflicts
        const { data: conflict } = await supabase
            .from('bookings')
            .select('id')
            .eq('item_id', itemId)
            .neq('status', 'cancelled')
            .or(`and(date.lte.${finalEndDate},end_date.gte.${date})`)
            .limit(1)
            .single();

        if (conflict) {
            return c.json({ error: 'Ce studio est déjà réservé pour cette période' }, 409);
        }

        const { data, error } = await supabase
            .from('bookings')
            .insert([{ user_id: user.id, item_id: itemId, date, end_date: finalEndDate, status: 'confirmed' }])
            .select()
            .single();

        if (error) throw error;
        return c.json({ message: 'Réservation confirmée', id: data.id }, 201);
    } catch (error) {
        return c.json({ error: 'Échec de la réservation', details: error.message }, 500);
    }
});

app.get('/api/bookings/my-bookings', authMiddleware, async (c) => {
    const user = c.get('user');
    const supabase = getSupabase(c);
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, studios(name, price_per_hour, city, equipments)')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (error) throw error;
        // Enforce same response shape as D1
        const results = data.map(b => ({
            ...b,
            studio_name: b.studios?.name,
            price_per_hour: b.studios?.price_per_hour,
            city: b.studios?.city,
            equipments: b.studios?.equipments
        }));
        return c.json(results);
    } catch (error) {
        return c.json({ error: 'Failed to fetch bookings' }, 500);
    }
});

app.get('/api/items/:id/bookings', async (c) => {
    const itemId = c.req.param('id');
    const supabase = getSupabase(c);
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('date')
            .eq('item_id', itemId)
            .neq('status', 'cancelled');

        if (error) throw error;
        return c.json(data);
    } catch (error) {
        return c.json({ error: 'Failed to fetch availability' }, 500);
    }
});

// --- Reviews API ---

app.post('/api/items/:id/reviews', authMiddleware, async (c) => {
    const studioId = c.req.param('id');
    const { rating, comment } = await c.req.json();
    const user = c.get('user');
    const supabase = getSupabase(c);

    if (!rating || rating < 1 || rating > 5) return c.json({ error: 'Valid rating (1-5) is required' }, 400);

    try {
        const { error } = await supabase
            .from('reviews')
            .insert([{ user_id: user.id, studio_id: studioId, rating, comment }]);

        if (error) throw error;
        return c.json({ message: 'Review added' }, 201);
    } catch (error) {
        return c.json({ error: 'Failed to add review' }, 500);
    }
});

app.get('/api/items/:id/reviews', async (c) => {
    const studioId = c.req.param('id');
    const supabase = getSupabase(c);
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, users(username)')
            .eq('studio_id', studioId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        const results = data.map(r => ({ ...r, username: r.users?.username }));
        return c.json(results);
    } catch (error) {
        return c.json({ error: 'Failed to fetch reviews' }, 500);
    }
});

// ========================================
// Scraping API (n8n Integration) - UNCHANGED Logic
// ========================================

app.get('/api/scraping/trigger', authMiddleware, async (c) => {
    const city = c.req.query('city');
    const keyword = c.req.query('keyword');
    const user = c.get('user');

    if (!city || !keyword) return c.json({ error: 'City and keyword are required' }, 400);

    const webhookUrl = c.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) return c.json({ error: 'n8n Webhook URL is not configured' }, 500);

    try {
        const url = new URL(webhookUrl);
        url.searchParams.append('city', city);
        url.searchParams.append('keyword', keyword);
        url.searchParams.append('userEmail', user.email);

        const response = await fetch(url.toString(), { method: 'GET' });

        if (!response.ok) {
            const errorText = await response.text();
            return c.json({ error: 'Failed to trigger scraping workflow', n8nStatus: response.status, n8nError: errorText }, 502);
        }

        const data = await response.json();
        return c.json({ success: true, message: 'Scraping finished successfully', sheetUrl: data.sheetUrl });
    } catch (error) {
        return c.json({ error: 'Internal server error during scraping trigger', details: error.message }, 500);
    }
});

// Serve static files
app.get('/css/*', serveStatic({ manifest }))
app.get('/js/*', serveStatic({ manifest }))

// Specific HTML routes to ensure correct mapping
const htmlFiles = [
    'index.html', 'studios.html', 'studio-detail.html',
    'login.html', 'register.html', 'favorites.html',
    'add-studio.html', 'my-bookings.html', 'scraping.html'
]

htmlFiles.forEach(file => {
    app.get(`/${file}`, serveStatic({ path: file, manifest }))
})

// Root redirect/serve for index.html
app.get('/', serveStatic({ path: 'index.html', manifest }))

// Catch-all static (ONLY if it hasn't matched any API or specific route)
app.get('*', serveStatic({ manifest }))

export default app
