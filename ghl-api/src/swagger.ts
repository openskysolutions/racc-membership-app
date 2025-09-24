import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'fs';
import path from 'path';

// Load the OpenAPI spec from our contracts directory (relative to project root)
const openApiPath = path.join(__dirname, '../../specs/001-a-membership-portal/contracts/openapi.yaml');
const openApiYaml = fs.readFileSync(openApiPath, 'utf8');
const swaggerSpec = YAML.parse(openApiYaml);

export {
  swaggerUi,
  swaggerSpec
};
