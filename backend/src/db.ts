export interface Env {
  DB: D1Database;

  FRONTEND_URL?: string;

  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
}

export type AppBindings = {
  Bindings: Env;
};

export default Env;