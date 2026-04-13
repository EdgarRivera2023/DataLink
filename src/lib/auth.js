// src/lib/auth.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs"; // Cambiamos esto para asegurar compatibilidad

async function refreshAccessToken(token) {
  // ... (Pega aquí toda tu función refreshAccessToken tal cual la tienes)
}

export const authOptions = {
  // ... (Pega aquí todo tu objeto authOptions tal cual lo tienes)
};