/// <reference path="./.sst/platform/config.d.ts" />

// Minimal stub — full deployment config comes in the deployment PRD.
export default $config({
  app(input) {
    return {
      name: "energyos",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "eu-central-1",
        },
      },
    };
  },
  async run() {
    // Resources will be added in the deployment PRD.
  },
});
