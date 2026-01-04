const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Service role client (bypassa RLS)
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

class BusinessRepository {
    async getAllActive() {
        // Public access for registration dropdown
        const { data, error } = await supabase
            .from('businesses')
            .select('id, name')
            .eq('status', 'active')
            .order('name');

        if (error) throw new Error(error.message);
        return data;
    }

    async getAll() {
        // Super admin access to all businesses with full details
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .order('name');

        if (error) throw new Error(error.message);
        return data;
    }

    async create(name) {
        const { data, error } = await supabase
            .from('businesses')
            .insert([{ name, status: 'active' }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async getById(id) {
        const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async update(id, businessData) {
        const { data, error } = await supabase
            .from('businesses')
            .update(businessData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async delete(id) {
        const { data, error } = await supabase
            .from('businesses')
            .update({ status: 'inactive' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
}

module.exports = new BusinessRepository();
