import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { QueryGlobal } from '../common/dto/query.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email Sudah Digunakan');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        profile: {
          create: { fullName: createUserDto.displayName },
        },
      },
      include: {
        profile: true,
      },
    });

    return {
      message: 'Berhasil Membuat User',
      user: user,
    };
  }

  async findAll(query: QueryGlobal) {
    const { page = 1, limit = 10, search } = query;

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              email: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              profile: {
                fullName: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          ],
        }
      : {};

    const [user, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      user,
      pagination: {
        curentPage: page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User tidak dapat ditemukan');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User tidak dapat ditemukan');
    }

    const updateUser = await this.prisma.user.update({
      where: { id },
      data: {
        email: updateUserDto.email,
        phone: updateUserDto.phone,
        role: updateUserDto.role,
        profile: {
          update: {
            fullName: updateUserDto.displayName,
          },
        },
      },
    });

    return {
      message: 'Data Berhasil Diupdate',
      user: updateUser,
    };
  }

  async remove(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Data user tidak dapat ditemukan');
    }

    const removeUser = await this.prisma.user.delete({
      where: { id: existingUser.id },
    });

    return {
      message: 'User Berhasil Dihapus',
      user: removeUser,
    };
  }

  async banUser(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Data User tidak dapat ditemukan');
    }

    const user = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        isBanned: true,
      },
      select: {
        email: true,
      },
    });

    return {
      message: `User dengan email ${user.email} berhasil di ban dari sistem`,
      user,
    };
  }

  async unBanUser(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Data User tidak dapat ditemukan');
    }

    const user = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        isBanned: false,
      },
      select: {
        email: true,
      },
    });

    return {
      message: `User dengan email ${user.email} berhasil di unban dari sistem`,
      user,
    };
  }
}
