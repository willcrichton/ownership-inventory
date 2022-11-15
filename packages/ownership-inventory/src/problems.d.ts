// TS won't let me specify the type just for a single .toml file :')
declare module "*.toml" {
  export const problems: { name: string; code: string }[];
}
