// src/lib/auth.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

async function refreshAccessToken(token) {
  try {
    const url = "https://api.podio.com/oauth/token";
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.PODIO_CLIENT_ID,
      client_secret: process.env.PODIO_CLIENT_SECRET,
      refresh_token: token.podioRefreshToken,
    });
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;
    return {
      ...token,
      podioAccessToken: refreshedTokens.access_token,
      podioAccessTokenExpiresAt: Date.now() + refreshedTokens.expires_in * 1000,
      podioRefreshToken: refreshedTokens.refresh_token ?? token.podioRefreshToken,
    };
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // 1. Master Auth
          const masterAuthResponse = await fetch('https://api.podio.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'password', 
              client_id: process.env.PODIO_CLIENT_ID, 
              client_secret: process.env.PODIO_CLIENT_SECRET,
              username: process.env.PODIO_USERNAME, 
              password: process.env.PODIO_PASSWORD,
            }),
          });
          if (!masterAuthResponse.ok) throw new Error('Master Auth failed');
          const { access_token: masterAccessToken } = await masterAuthResponse.json();

          // 2. Search Staff
          const filterBody = { filters: { [process.env.PODIO_STAFF_USERNAME_FIELD_ID]: credentials.username }, limit: 1 };
          const searchResponse = await fetch(`https://api.podio.com/item/app/${process.env.PODIO_STAFF_APP_ID}/filter/`, {
            method: 'POST',
            headers: { 'Authorization': `OAuth2 ${masterAccessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(filterBody)
          });
          const searchData = await searchResponse.json();
          if (!searchResponse.ok || searchData.items.length === 0) return null;

          const staffItem = searchData.items[0];
          const findField = (id) => staffItem.fields.find(f => f.external_id === id || f.field_id == id);
          
          const storedHash = findField(process.env.PODIO_STAFF_PASSWORD_FIELD_ID)?.values[0]?.value;
          const status = findField(process.env.PODIO_STAFF_STATUS_FIELD_ID)?.values[0]?.value?.text;

          if (status === 'Activo' && await bcrypt.compare(credentials.password, storedHash)) {
             const userAuthRes = await fetch('https://api.podio.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  grant_type: 'password',
                  client_id: process.env.PODIO_CLIENT_ID,
                  client_secret: process.env.PODIO_CLIENT_SECRET,
                  username: credentials.username,
                  password: credentials.password,
                }),
              });
              const userData = await userAuthRes.json();
              return {
                id: staffItem.item_id,
                name: staffItem.title,
                role: findField(process.env.PODIO_STAFF_ROLE_FIELD_ID)?.values[0]?.value?.text?.toLowerCase(),
                podioAccessToken: userData.access_token,
                podioRefreshToken: userData.refresh_token,
                podioAccessTokenExpiresAt: Date.now() + userData.expires_in * 1000,
              };
          }
          return null;
        } catch (e) { return null; }
      }
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.podioAccessToken = user.podioAccessToken;
        token.podioRefreshToken = user.podioRefreshToken;
        token.podioAccessTokenExpiresAt = user.podioAccessTokenExpiresAt;
        return token;
      }
      if (Date.now() < token.podioAccessTokenExpiresAt - 60000) return token;
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session?.user) session.user.role = token.role;
      session.podioAccessToken = token.podioAccessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};