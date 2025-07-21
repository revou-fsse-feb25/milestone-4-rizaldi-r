export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'dev-secret', // (or you can use process.env.JWT_SECRET and store in .env)
};
