declare module 'custom-env' {
  const customEnv: {
    env: (envName?: string) => void;
  };
  export default customEnv;
}
