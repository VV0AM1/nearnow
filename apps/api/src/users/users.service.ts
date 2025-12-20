import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  create(createUserInput: CreateUserInput) {
    return this.prisma.user.create({
      data: createUserInput,
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  update(id: string, updateUserInput: UpdateUserInput) {
    const { id: _, ...data } = updateUserInput;
    return this.prisma.user.update({
      where: { id },
      data: data,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getSavedPosts(userId: string) {
    return this.prisma.savedPost.findMany({
      where: { userId },
      include: { post: true }, // Include full post details
      orderBy: { createdAt: 'desc' }
    });
  }

  async toggleSavedPost(userId: string, postId: string) {
    const existing = await this.prisma.savedPost.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    });

    if (existing) {
      await this.prisma.savedPost.delete({
        where: { id: existing.id }
      });
      return { saved: false };
    } else {
      await this.prisma.savedPost.create({
        data: { userId, postId }
      });
      return { saved: true };
    }
  }

  async isPostSaved(userId: string, postId: string) {
    const count = await this.prisma.savedPost.count({
      where: { userId, postId }
    });
    return count > 0;
  }
}
