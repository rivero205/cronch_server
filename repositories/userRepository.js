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

class UserRepository {
    async createProfile(userId, businessId, profileData) {
        const { data, error } = await supabase
            .from('profiles')
            .insert([{
                id: userId,
                business_id: businessId,
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                phone: profileData.phone,
                position: profileData.position,
                role: 'manager', // Default role
                is_active: true
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async getProfileByUserId(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                business:businesses(*)
            `)
            .eq('id', userId)
            .maybeSingle();

        console.log('🔍 getProfileByUserId - userId:', userId);
        console.log('🔍 getProfileByUserId - data:', JSON.stringify(data, null, 2));
        console.log('🔍 getProfileByUserId - error:', error);

        if (error) throw new Error(error.message);
        return data;
    }

    async getUsersByBusiness(businessId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('business_id', businessId)
            .order('first_name');

        if (error) throw new Error(error.message);
        return data;
    }

    async getAllUsers() {
        // For super admin - get all users across all businesses
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                business:businesses(id, name)
            `)
            .order('business_id', { ascending: true })
            .order('first_name', { ascending: true });

        if (error) throw new Error(error.message);
        return data;
    }

    async updateProfile(userId, updates) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateUserRole(userId, role) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateUserStatus(userId, isActive) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ is_active: isActive })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
}

module.exports = new UserRepository();
