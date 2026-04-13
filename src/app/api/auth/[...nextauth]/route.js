import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// This function handles token refreshing
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
      body: body,
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
    console.error("Error refreshing access token:", error);
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
          console.log("🚀 Auth Process Started for:", credentials?.username);

          // 1. MASTER AUTHENTICATION
          console.log("--- [STEP 1]: Master Podio Authentication ---");
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

          if (!masterAuthResponse.ok) {
            const errorData = await masterAuthResponse.json();
            console.error("❌ MASTER AUTH FAILED:", errorData);
            throw new Error('Podio master authentication failed');
          }
          
          const masterAuthData = await masterAuthResponse.json();
          const masterAccessToken = masterAuthData.access_token;
          console.log("✅ Master Auth Success");

          // 2. SEARCH FOR USER IN STAFF APP
          console.log("--- [STEP 2]: Searching Staff App ---");
          const filterBody = { 
            filters: { [process.env.PODIO_STAFF_USERNAME_FIELD_ID]: credentials.username }, 
            limit: 1 
          };
          
          const searchResponse = await fetch(`https://api.podio.com/item/app/${process.env.PODIO_STAFF_APP_ID}/filter/`, {
            method: 'POST',
            headers: { 
                'Authorization': `OAuth2 ${masterAccessToken}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(filterBody)
          });

          if (!searchResponse.ok) {
            console.error("❌ STAFF SEARCH FAILED. Check PODIO_STAFF_APP_ID or Field IDs.");
            throw new Error('Podio user search failed');
          }
          
          const searchData = await searchResponse.json();
          if (searchData.items.length === 0) {
            console.warn("⚠️ User not found in Staff App.");
            return null;
          }

          const staffItem = searchData.items[0];
          const findField = (externalId) => staffItem.fields.find(f => f.external_id === externalId);
          
          const storedPasswordHash = findField(process.env.PODIO_STAFF_PASSWORD_FIELD_ID)?.values[0]?.value;
          const role = findField(process.env.PODIO_STAFF_ROLE_FIELD_ID)?.values[0]?.value?.text;
          const status = findField(process.env.PODIO_STAFF_STATUS_FIELD_ID)?.values[0]?.value?.text;
          
          console.log(`--- [STEP 3]: Verification (Role: ${role}, Status: ${status}) ---`);

          if (!storedPasswordHash || !role || !status) {
            console.error("❌ Missing required fields in Staff App item.");
            return null;
          }
          
          // 3. BCRYPT PASSWORD CHECK
          const passwordsMatch = await bcrypt.compare(credentials.password, storedPasswordHash);

          if (passwordsMatch && status === 'Activo') {
            console.log("--- [STEP 4]: Final User-Specific Auth ---");
            const userAuthResponse = await fetch('https://api.podio.com/oauth/token', {
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

            if (!userAuthResponse.ok) {
              const userError = await userAuthResponse.json();
              console.error("❌ USER-SPECIFIC AUTH FAILED:", userError);
              throw new Error('Failed to get user-specific Podio token');
            }

            const userAuthData = await userAuthResponse.json();
            console.log("✅ LOGIN SUCCESSFUL");
            
            const emailField = staffItem.fields.find(f => f.type === 'email');
            return {
              id: staffItem.item_id,
              name: staffItem.title,
              email: emailField ? emailField.values[0].value : null,
              role: role.toLowerCase(),
              podioAccessToken: userAuthData.access_token,
              podioRefreshToken: userAuthData.refresh_token,
              podioAccessTokenExpiresAt: Date.now() + userAuthData.expires_in * 1000,
            };
          } else {
            console.warn("❌ Password mismatch or User Inactive.");
          }
          return null;
        } catch (error) {
          console.error("⛔ CRITICAL AUTHORIZE ERROR:", error.message);
          return null;
        }
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
      
      const buffer = 60 * 1000;
      if (Date.now() < token.podioAccessTokenExpiresAt - buffer) {
        return token;
      }

      console.log("🔄 Token expired. Refreshing...");
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role;
      }
      session.podioAccessToken = token.podioAccessToken;
      session.error = token.error;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };