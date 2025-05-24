const fs = require('fs');
const path = require('path');

interface CountryPath {
  id: string;
  name: string;
  path: string;
}

const extractCountryPaths = (svgContent: string): CountryPath[] => {
  const paths: CountryPath[] = [];
  const pathRegex = /<path[^>]*d="([^"]*)"[^>]*id="([^"]*)"[^>]*name="([^"]*)"[^>]*>/g;
  
  let match;
  while ((match = pathRegex.exec(svgContent)) !== null) {
    const [_, path, id, name] = match;
    if (id && name) {
      paths.push({ id, name, path });
    }
  }
  
  return paths;
};

const generateTypeScriptFile = (paths: CountryPath[]): string => {
  return `export interface CountryData {
  id: string;
  name: string;
  path: string;
}

export const getCountryName = (countryCode: string): string => {
  const country = countryPaths.find(c => c.id === countryCode);
  return country ? country.name : countryCode;
};

export const countryPaths: CountryData[] = ${JSON.stringify(paths, null, 2)};
`;
};

const main = () => {
  const svgPath = path.join(process.cwd(), 'src', 'assets', 'world-map.svg');
  const outputPath = path.join(process.cwd(), 'src', 'utils', 'countryData.ts');

  try {
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const paths = extractCountryPaths(svgContent);
    const tsContent = generateTypeScriptFile(paths);
    fs.writeFileSync(outputPath, tsContent);
    console.log(`Successfully processed ${paths.length} country paths`);
  } catch (error) {
    console.error('Error processing SVG paths:', error);
  }
};

main(); 