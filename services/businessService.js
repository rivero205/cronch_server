const businessRepository = require('../repositories/businessRepository');

class BusinessService {
    async getActiveBusinesses() {
        return await businessRepository.getAllActive();
    }

    async getAllBusinesses() {
        // For super admin - returns all businesses with full details
        return await businessRepository.getAll();
    }

    async createBusiness(businessData) {
        if (!businessData.name) throw new Error('Business name is required');
        
        // Validate and sanitize data
        const data = {
            name: businessData.name,
            description: businessData.description || null,
            address: businessData.address || null,
            city: businessData.city || null,
            country: businessData.country || 'Colombia',
            phone: businessData.phone || null,
            email: businessData.email || null,
            website: businessData.website || null,
            tax_id: businessData.tax_id || null,
            industry: businessData.industry || null,
            employee_count: businessData.employee_count || null,
            status: 'active'
        };

        return await businessRepository.create(data.name);
    }

    async getBusinessById(id) {
        if (!id) throw new Error('Business ID is required');
        return await businessRepository.getById(id);
    }

    async updateBusiness(id, businessData) {
        if (!id) throw new Error('Business ID is required');
        
        // Only update fields that are provided
        const allowedFields = [
            'name', 'description', 'address', 'city', 'country',
            'phone', 'email', 'website', 'tax_id', 'industry', 
            'employee_count', 'logo_url', 'status'
        ];
        
        const updates = {};
        allowedFields.forEach(field => {
            if (businessData[field] !== undefined) {
                updates[field] = businessData[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            throw new Error('No valid fields to update');
        }

        return await businessRepository.update(id, updates);
    }

    async deactivateBusiness(id) {
        if (!id) throw new Error('Business ID is required');
        return await businessRepository.delete(id);
    }
}

module.exports = new BusinessService();
