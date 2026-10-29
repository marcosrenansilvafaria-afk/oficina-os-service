module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'test/bdd',
  testRegex: '.*\\.steps\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '.*/generated/prisma/client$': '<rootDir>/../../__mocks__/prisma-client.mock.ts',
    '@prisma/adapter-pg': '<rootDir>/../../__mocks__/prisma-adapter-pg.mock.ts',
  },
  testEnvironment: 'node',
};
