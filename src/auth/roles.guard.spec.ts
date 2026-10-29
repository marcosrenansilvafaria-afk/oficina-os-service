import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { RolesGuard } from './roles.guard';

function makeContext(user?: { userId: string; role: Role }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('deve permitir quando nao ha roles requeridas', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('deve negar quando ha role requerida e usuario ausente', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ATENDENTE]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(makeContext())).toThrow(ForbiddenException);
  });

  it('deve permitir sempre para ADMIN', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.MECANICO]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const allowed = guard.canActivate(
      makeContext({ userId: 'admin', role: Role.ADMIN }),
    );

    expect(allowed).toBe(true);
  });

  it('deve negar quando role nao permitida', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ATENDENTE]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(makeContext({ userId: 'mec', role: Role.MECANICO })),
    ).toThrow(ForbiddenException);
  });

  it('deve permitir quando role requerida bate com usuario', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ATENDENTE]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const allowed = guard.canActivate(
      makeContext({ userId: 'atd', role: Role.ATENDENTE }),
    );

    expect(allowed).toBe(true);
  });
});
