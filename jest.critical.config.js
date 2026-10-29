module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '.*/generated/prisma/client$': '<rootDir>/../__mocks__/prisma-client.mock.ts',
    '@prisma/adapter-pg': '<rootDir>/../__mocks__/prisma-adapter-pg.mock.ts',
  },
  collectCoverageFrom: ['domain/entities/**/*.ts', 'application/use-cases/**/*.ts'],
  coverageDirectory: '../coverage/critical',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testEnvironment: 'node',
};
