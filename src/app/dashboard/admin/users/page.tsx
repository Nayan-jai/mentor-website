"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: string | null;
  bookingsCount?: number;
  lastLogin?: string | null;
  deleted?: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users);
    setLoading(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name || "", email: user.email, password: "", role: user.role });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    const body: any = { name: form.name, email: form.email, role: form.role };
    if (form.password && form.password.length >= 8) {
      body.password = form.password;
    }
    await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditingUser(null);
    fetchUsers();
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.email}?`)) return;
    await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });
    fetchUsers();
  };

  const filteredUsers = users.filter(u =>
    (u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())) &&
    (roleFilter ? u.role === roleFilter : true)
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MENTOR">Mentor</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Role</th>
              <th className="border px-4 py-2">Registered</th>
              <th className="border px-4 py-2">Last Login</th>
              <th className="border px-4 py-2">Bookings</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={user.deleted ? "bg-gray-100 text-gray-400" : ""}>
                <td className="border px-4 py-2">{user.name}</td>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.role}</td>
                <td className="border px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="border px-4 py-2">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "-"}</td>
                <td className="border px-4 py-2">{user.bookingsCount ?? 0}</td>
                <td className="border px-4 py-2">{user.deleted ? "Deactivated" : "Active"}</td>
                <td className="border px-4 py-2 flex gap-2">
                  <Button size="sm" onClick={() => handleEdit(user)} disabled={user.deleted}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(user)} disabled={user.deleted}>
                    Deactivate
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <Card className="p-8 w-96 bg-white">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="mb-4">
              <Label>Name</Label>
              <Input name="name" value={form.name} onChange={handleChange} />
            </div>
            <div className="mb-4">
              <Label>Email</Label>
              <Input name="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="mb-4">
              <Label>Password (leave blank to keep unchanged)</Label>
              <Input name="password" type="password" value={form.password} onChange={handleChange} />
            </div>
            <div className="mb-4">
              <Label>Role</Label>
              <select name="role" value={form.role} onChange={handleChange} className="w-full border rounded px-2 py-1">
                <option value="ADMIN">Admin</option>
                <option value="MENTOR">Mentor</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 