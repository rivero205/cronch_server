const userRepository = require('../repositories/userRepository');

class UserService {
    async createProfile(userId, businessId, profileData) {
        if (!userId || !businessId) throw new Error('User ID and Business ID are required');

        // Basic validation
        if (!profileData.firstName || !profileData.lastName) {
            throw new Error('First Name and Last Name are required');
        }

        return await userRepository.createProfile(userId, businessId, profileData);
    }

    async getMyProfile(userId) {
        if (!userId) throw new Error('User ID is required');
        return await userRepository.getProfileByUserId(userId);
    }

    async getBusinessUsers(requestorId) {
        // First get requestor's profile to know which business they belong to
        const profile = await userRepository.getProfileByUserId(requestorId);
        if (!profile || !profile.business_id) throw new Error('User does not belong to a business');

        return await userRepository.getUsersByBusiness(profile.business_id);
    }

    async getAllUsers() {
        // For super admin - get all users across all businesses
        return await userRepository.getAllUsers();
    }

    async getUserById(userId) {
        if (!userId) throw new Error('User ID is required');
        return await userRepository.getProfileByUserId(userId);
    }

    async updateUserRole(userId, role) {
        const validRoles = ['super_admin', 'admin', 'editor', 'manager'];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }
        return await userRepository.updateUserRole(userId, role);
    }

    async updateUserStatus(userId, isActive) {
        return await userRepository.updateUserStatus(userId, isActive);
    }

    async assignUserToBusiness(userId, businessId) {
        return await userRepository.updateProfile(userId, { business_id: businessId });
    }
}

module.exports = new UserService();
