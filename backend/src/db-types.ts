export interface Env {
  DB: D1Database;

  FRONTEND_URL?: string;
}

export type AppBindings = {
  Bindings: Env;
};

export default Env;
