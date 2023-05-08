const isWeb = process.env.BUILD_MODE !== 'native';

console.log('next.config.js', { isWeb });

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isWeb ? undefined : 'export',
};

module.exports = nextConfig;
