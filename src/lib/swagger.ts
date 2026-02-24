import * as swaggerJSDoc from "swagger-jsdoc";
export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Recepti API",
      version: "1.0.0",
      description: "API specifikacija aplikacije za recepte",
    },
  },
  apis: ["./src/app/api/**/*.ts"],
});