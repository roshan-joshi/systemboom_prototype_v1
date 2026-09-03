import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "prototype-evidence/**", "public/**"] },
  ...coreWebVitals,
  ...typescript,
  {
    // The Cosmos scene layer drives three.js imperatively inside R3F
    // useFrame/ref callbacks. The React-Compiler purity rules false-positive
    // on that model; they stay enabled everywhere else.
    files: ["src/components/cosmos/**", "src/components/earth/**"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
    },
  },
];

export default eslintConfig;
