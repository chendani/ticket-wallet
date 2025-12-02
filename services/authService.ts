
import { User } from '../types';

const USERS_KEY = 'app_users';
const CURRENT_USER_KEY = 'app_current_user';

// Mock DB helper
const getUsers = (): User[] => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
};

const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
    getCurrentUser: (): User | null => {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    login: async (email: string, password: string): Promise<User> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            return user;
        }
        throw new Error('שם משתמש או סיסמא שגויים');
    },

    signup: async (name: string, email: string, password: string): Promise<User> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const users = getUsers();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('המייל הזה כבר רשום במערכת');
        }

        const newUser: User = {
            id: `usr_${Date.now()}`,
            name,
            email,
            password,
            isGoogle: false
        };

        users.push(newUser);
        saveUsers(users);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
        return newUser;
    },

    googleLogin: async (): Promise<User> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock Google Login - In a real app this would involve OAuth flow
        // We will simulate a user being created or retrieved based on a fake google profile
        const mockGoogleUser = {
            email: 'google_user@gmail.com',
            name: 'משתמש גוגל',
            id: 'google_123456'
        };

        const users = getUsers();
        let user = users.find(u => u.email === mockGoogleUser.email);
        
        if (!user) {
            user = {
                ...mockGoogleUser,
                isGoogle: true
            };
            users.push(user);
            saveUsers(users);
        }

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
    },

    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    // Password Reset Flow
    requestPasswordReset: async (email: string): Promise<string> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            throw new Error('המייל לא נמצא במערכת');
        }

        if (user.isGoogle) {
            throw new Error('זהו חשבון גוגל, אנא התחבר באמצעות כפתור גוגל');
        }

        // Generate a 4 digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        
        // In a real app, send email here. 
        // For this demo, we will return the code to be shown in an alert/console
        console.log(`Reset code for ${email}: ${code}`);
        return code;
    },

    resetPassword: async (email: string, newPassword: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        const users = getUsers();
        const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (userIndex === -1) throw new Error('משתמש לא נמצא');
        
        users[userIndex].password = newPassword;
        saveUsers(users);
    }
};
