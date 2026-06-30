const fs = require('fs');
const path = require('path');

const API_HTML_PATH = path.join(__dirname, '..', 'api', 'index.html');
const OPENAPI_JSON_PATH = path.join(__dirname, '..', 'api', 'openapi.json');
const LLMS_TXT_PATH = path.join(__dirname, '..', 'llms.txt');

function cleanHtml(html) {
    return html
        .replace(/<[^>]+>/g, '') // strip tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

function parseParameters() {
    const html = fs.readFileSync(API_HTML_PATH, 'utf8');
    
    // Find the parameters table body
    const tableBodyMatch = html.match(/<table class="params-table">[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
    if (!tableBodyMatch) {
        console.error('Could not find parameters table in api/index.html');
        process.exit(1);
    }

    const tbody = tableBodyMatch[1];
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    const cellRegex = /<td>([\s\S]*?)<\/td>/g;
    
    const parameters = [];
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tbody)) !== null) {
        const rowContent = rowMatch[1];
        const cells = [];
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
            cells.push(cellMatch[1].trim());
        }

        if (cells.length >= 5) {
            const name = cleanHtml(cells[0]);
            const type = cleanHtml(cells[1]);
            const required = cleanHtml(cells[2]).toLowerCase().includes('yes');
            const defaultValueRaw = cleanHtml(cells[3]);
            const defaultValue = defaultValueRaw === '—' ? null : defaultValueRaw;
            const description = cleanHtml(cells[4]);

            parameters.push({
                name,
                type,
                required,
                defaultValue,
                description
            });
        }
    }

    return parameters;
}

function generateOpenApi(params) {
    const openApiParams = params.map(p => {
        const schema = {
            type: p.type.toLowerCase() === 'number' ? 'integer' : p.type.toLowerCase() === 'boolean' ? 'boolean' : 'string'
        };

        if (p.defaultValue !== null) {
            if (schema.type === 'integer') {
                schema.default = parseInt(p.defaultValue, 10);
            } else if (schema.type === 'boolean') {
                schema.default = p.defaultValue === 'true' || p.defaultValue === '1';
            } else {
                schema.default = p.defaultValue;
            }
        }

        // Add enum values if documented in description
        if (p.name === 'format') {
            schema.enum = ['png', 'svg', 'base64'];
        } else if (p.name === 'ecl') {
            schema.enum = ['L', 'M', 'Q', 'H'];
        } else if (p.name === 'iconBg') {
            schema.enum = ['rounded', 'circle', 'square', 'none'];
        }

        return {
            name: p.name,
            in: 'query',
            required: p.required,
            description: p.description,
            schema
        };
    });

    const spec = {
        openapi: "3.0.3",
        info: {
            title: "QR Maker API",
            description: "Developer API to generate customized QR codes on the fly using standard HTTP requests.",
            version: "1.0.0"
        },
        servers: [
            {
                url: "https://qrmaker.ryanmarch.me"
            }
        ],
        paths: {
            "/api/qr": {
                "get": {
                    "summary": "Generate a QR code (Public / Standard Rate Limits)",
                    "description": "Generate custom styled QR codes using standard rate limits without authentication.",
                    "operationId": "generatePublicQr",
                    "parameters": openApiParams,
                    "responses": {
                        "200": {
                            "description": "Successful QR Code generation",
                            "content": {
                                "image/png": {
                                    "schema": {
                                        "type": "string",
                                        "format": "binary"
                                    }
                                },
                                "image/svg+xml": {
                                    "schema": {
                                        "type": "string"
                                    }
                                },
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/Base64Response"
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "Invalid parameter values or missing content"
                        }
                    }
                }
            },
            "/api/plus": {
                "get": {
                    "summary": "Generate a QR code (Plus / Higher Rate Limits)",
                    "description": "Generate custom styled QR codes using higher rate limits (requires Bearer API key).",
                    "operationId": "generatePlusQr",
                    "security": [
                        {
                            "BearerAuth": []
                        }
                    ],
                    "parameters": openApiParams,
                    "responses": {
                        "200": {
                            "description": "Successful QR Code generation",
                            "content": {
                                "image/png": {
                                    "schema": {
                                        "type": "string",
                                        "format": "binary"
                                    }
                                },
                                "image/svg+xml": {
                                    "schema": {
                                        "type": "string"
                                    }
                                },
                                "application/json": {
                                    "schema": {
                                        "$ref": "#/components/schemas/Base64Response"
                                    }
                                }
                            }
                        },
                        "401": {
                            "description": "Unauthorized or missing API Key"
                        },
                        "400": {
                            "description": "Invalid parameter values or missing content"
                        }
                    }
                }
            }
        },
        "components": {
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer"
                }
            },
            "schemas": {
                "Base64Response": {
                    "type": "object",
                    "properties": {
                        "data": {
                            "type": "string",
                            "description": "Base64 encoded Data URI of the generated QR code image.",
                            "example": "data:image/png;base64,iVBORw0KGgoAAA..."
                        }
                    }
                }
            }
        }
    };

    fs.writeFileSync(OPENAPI_JSON_PATH, JSON.stringify(spec, null, 2), 'utf8');
    console.log('✓ Successfully regenerated api/openapi.json');
}

function generateLlmstxt(params) {
    let markdown = `# QR Maker API\n\n`;
    markdown += `Fully customized QR code generation endpoints. Generates dynamic QR codes with customizable colors, formatting, icons, error correction, and rounded corners on the fly.\n\n`;
    markdown += `## Endpoints\n\n`;
    markdown += `### 1. Public Endpoint (Standard Rate Limits)\n`;
    markdown += `\`GET https://qrmaker.ryanmarch.me/api/qr\`\n`;
    markdown += `- Public access, no authentication required.\n`;
    markdown += `- Subject to standard rate limiting.\n\n`;
    markdown += `### 2. Plus Endpoint (Higher Rate Limits)\n`;
    markdown += `\`GET https://qrmaker.ryanmarch.me/api/plus\`\n`;
    markdown += `- Requires bearer API Key.\n`;
    markdown += `- Higher rate limit threshold (up to 20 requests per 10 seconds).\n\n`;
    markdown += `---\n\n`;
    markdown += `## Authentication\n`;
    markdown += `Add your API key to the \`Authorization\` header:\n`;
    markdown += `\`\`\`http\n`;
    markdown += `Authorization: Bearer YOUR_API_KEY\n`;
    markdown += `\`\`\`\n\n`;
    markdown += `---\n\n`;
    markdown += `## Query Parameters\n\n`;
    markdown += `| Parameter | Type | Required | Default | Description |\n`;
    markdown += `| :--- | :--- | :--- | :--- | :--- |\n`;

    params.forEach(p => {
        const reqStr = p.required ? 'Yes' : 'No';
        const defStr = p.defaultValue === null ? '-' : `\`${p.defaultValue}\``;
        markdown += `| \`${p.name}\` | ${p.type} | ${reqStr} | ${defStr} | ${p.description} |\n`;
    });

    markdown += `\n---\n\n`;
    markdown += `## Response Formats\n\n`;
    markdown += `### PNG Image (\`format=png\`)\n`;
    markdown += `- **Content-Type**: \`image/png\`\n`;
    markdown += `- **Response**: Raw PNG image binary data.\n\n`;
    markdown += `### SVG XML (\`format=svg\`)\n`;
    markdown += `- **Content-Type**: \`image/svg+xml; charset=utf-8\`\n`;
    markdown += `- **Response**: Lightweight SVG vector code.\n\n`;
    markdown += `### Base64 Data JSON (\`format=base64\`)\n`;
    markdown += `- **Content-Type**: \`application/json\`\n`;
    markdown += `- **Response**:\n`;
    markdown += `  \`\`\`json\n`;
    markdown += `  {\n`;
    markdown += `    "data": "data:image/png;base64,iVBORw0KGgo..."\n`;
    markdown += `  }\n`;
    markdown += `  \`\`\`\n`;

    fs.writeFileSync(LLMS_TXT_PATH, markdown, 'utf8');
    console.log('✓ Successfully regenerated llms.txt');
}

const params = parseParameters();
generateOpenApi(params);
generateLlmstxt(params);
