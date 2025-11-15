import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable()
export class AdminService {
  private users: User[] = [
    { id: '1', name: 'Admin', email: 'admin@westwallet.se', role: 'admin' },
    { id: '2', name: 'User', email: 'user@westwallet.se', role: 'user' },
  ];

  getUsers(): User[] {
    return this.users;
  }

  createUser(user: Omit<User, 'id'>): User {
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, user: Partial<User>): User | undefined {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx > -1) {
      this.users[idx] = { ...this.users[idx], ...user };
      return this.users[idx];
    }
    return undefined;
  }

  deleteUser(id: string): boolean {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx > -1) {
      this.users.splice(idx, 1);
      return true;
    }
    return false;
  }
}
