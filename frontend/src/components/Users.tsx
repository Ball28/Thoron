import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Mail, Building, Clock, ChevronDown, Check, UserPlus, Filter } from 'lucide-react';
import './Users.css';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: string;
    department: string;
    lastLogin: string;
    status: string;
    createdAt: string;
}

const ROLES = ['Admin', 'Dispatcher', 'Driver', 'Customer'];

export function Users() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:3001/api/users');
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (e) {
            console.error('Failed to fetch users', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = async (userId: number, newRole: string) => {
        setUpdatingId(userId);
        try {
            const res = await fetch(`http://localhost:3001/api/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            }
        } catch (e) {
            console.error('Failed to update role', e);
        } finally {
            setUpdatingId(null);
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'Admin': return 'role-admin';
            case 'Dispatcher': return 'role-dispatcher';
            case 'Driver': return 'role-driver';
            case 'Customer': return 'role-customer';
            default: return '';
        }
    };

    return (
        <div className="users-module flex flex-col h-full gap-lg">
            <div className="flex justify-between items-center mb-md">
                <div>
                    <h2 className="text-primary m-0 flex items-center gap-sm">
                        <Shield className="text-accent" size={24} /> User & Role Management
                    </h2>
                    <p className="text-secondary text-sm mt-xs">Manage system access, permissions, and security roles across Thoron TMS.</p>
                </div>
                <div className="flex gap-sm">
                    <button className="btn btn-secondary flex items-center gap-xs">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="btn btn-primary flex items-center gap-xs">
                        <UserPlus size={16} /> Add User
                    </button>
                </div>
            </div>

            <div className="card flex-1 p-0 overflow-hidden flex flex-col">
                <div className="table-container flex-1 overflow-auto">
                    <table className="users-table">
                        <thead className="sticky top-0 bg-surface-base z-10 shadow-sm">
                            <tr>
                                <th>Name & Email</th>
                                <th>Role / Access Level</th>
                                <th>Department</th>
                                <th>Last Login</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-xl text-muted">Loading user directory...</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="user-row hover:bg-surface-hover transition-colors">
                                    <td>
                                        <div className="font-medium text-primary">{user.name}</div>
                                        <div className="text-xs text-muted flex items-center gap-xs mt-[2px]">
                                            <Mail size={12} /> {user.email}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="role-selector-wrapper relative">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={updatingId === user.id}
                                                className={`role-badge ${getRoleBadgeClass(user.role)}`}
                                            >
                                                {ROLES.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="role-chevron" />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-xs text-secondary">
                                            <Building size={14} className="opacity-70" /> {user.department}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-xs text-sm text-muted">
                                            <Clock size={14} className="opacity-70" /> {new Date(user.lastLogin).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${user.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                            {user.status === 'Active' && <Check size={12} />} {user.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
