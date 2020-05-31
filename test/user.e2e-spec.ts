import { MockType } from '@root/mocks/mock.types';
import { internet, name } from 'faker';
import * as request from 'supertest';

import { RolesModule } from '@app/modules/permissions';
import { UserModule } from '@app/modules/users';
import { UserRepository } from '@app/modules/users/repositories';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@app/modules/users/repositories');

describe('User Tests (e2e)', () => {
  let app: INestApplication;
  let userRepository: MockType<UserRepository>;
  const user = {
    name: name.firstName(),
    email: internet.email(),
    password: 'Safe@Password123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UserModule, RolesModule],
    }).compile();

    app = module.createNestApplication();
    userRepository = module.get(UserRepository);

    await app.init();
  });

  it('/Should create user', () => {
    userRepository.findOne.mockReturnValueOnce(
      new Promise(resolve => resolve(null)),
    );

    userRepository.create.mockReturnValueOnce(
      new Promise(resolve => resolve(user)),
    );

    return request(app.getHttpServer())
      .post('/users')
      .send(user)
      .expect(201)
      .expect(({ body }) => {
        expect(body.name).toEqual(user.name);
        expect(body.email).toEqual(user.email);
      });
  });

  it('/Should deny create user with dupe email', () => {
    userRepository.findOne.mockReturnValueOnce(
      new Promise(resolve => resolve(user)),
    );
    return request(app.getHttpServer())
      .post('/users')
      .send(user)
      .expect(200)
      .expect(({ body }) => expect(body.code).toEqual(2000));
  });
});
