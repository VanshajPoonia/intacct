import nextVitals from "eslint-config-next/core-web-vitals"

export default [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "tsconfig.tsbuildinfo",
    ],
  },
  {
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
]
