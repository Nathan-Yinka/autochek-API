import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleImage } from '../entities/vehicle-image.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VehicleImageService {
  private readonly logger = new Logger(VehicleImageService.name);

  constructor(
    @InjectRepository(VehicleImage)
    private vehicleImageRepository: Repository<VehicleImage>,
  ) {}

  /**
   * Add images to a vehicle
   */
  async addImages(
    vehicleId: string,
    imageUrls: string[],
    filenames: string[],
  ): Promise<VehicleImage[]> {
    if (!imageUrls || imageUrls.length === 0) {
      return [];
    }

    // Get current max display order for this vehicle
    const maxOrder = await this.vehicleImageRepository
      .createQueryBuilder('image')
      .where('image.vehicleId = :vehicleId', { vehicleId })
      .select('MAX(image.displayOrder)', 'max')
      .getRawOne();

    const startOrder = (maxOrder?.max || 0) + 1;

    const images = imageUrls.map((url, index) => {
      return this.vehicleImageRepository.create({
        vehicleId,
        url,
        filename: filenames[index],
        displayOrder: startOrder + index,
        isPrimary: false, // Will be set separately if needed
      });
    });

    return this.vehicleImageRepository.save(images);
  }

  /**
   * Delete a specific image
   */
  async deleteImage(imageId: string, vehicleId: string): Promise<void> {
    const image = await this.vehicleImageRepository.findOne({
      where: { id: imageId, vehicleId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Delete from filesystem
    this.deleteImageFile(image.filename);

    // Delete from database
    await this.vehicleImageRepository.remove(image);
  }

  /**
   * Delete images by vehicle ID (when vehicle is deleted)
   */
  async deleteImagesByVehicleId(vehicleId: string): Promise<void> {
    const images = await this.vehicleImageRepository.find({ where: { vehicleId } });

    if (images.length > 0) {
      // Delete all files from filesystem
      images.forEach((image) => this.deleteImageFile(image.filename));

      // Delete all from database
      await this.vehicleImageRepository.remove(images);
    }
  }

  /**
   * Set primary image
   */
  async setPrimaryImage(imageId: string, vehicleId: string): Promise<VehicleImage> {
    // Remove primary flag from all images of this vehicle
    await this.vehicleImageRepository.update(
      { vehicleId },
      { isPrimary: false },
    );

    // Set this image as primary
    const image = await this.vehicleImageRepository.findOne({
      where: { id: imageId, vehicleId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    image.isPrimary = true;
    return this.vehicleImageRepository.save(image);
  }

  /**
   * Get all images for a vehicle
   */
  async getVehicleImages(vehicleId: string): Promise<VehicleImage[]> {
    return this.vehicleImageRepository.find({
      where: { vehicleId },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Reorder images
   */
  async reorderImages(vehicleId: string, imageIds: string[]): Promise<VehicleImage[]> {
    const images = await this.vehicleImageRepository.find({ where: { vehicleId } });

    const updatePromises = imageIds
      .map((imageId, index) => {
        const image = images.find((img) => img.id === imageId);
        if (image) {
          image.displayOrder = index;
          return this.vehicleImageRepository.save(image);
        }
        return null;
      })
      .filter((promise): promise is Promise<VehicleImage> => promise !== null);

    return Promise.all(updatePromises);
  }

  /**
   * Helper to delete image file from filesystem
   */
  private deleteImageFile(filename: string | undefined): void {
    if (!filename) return;

    try {
      const filePath = path.join(process.cwd(), 'uploads', 'vehicles', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted image file: ${filePath}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete image file ${filename}: ${error.message}`);
    }
  }
}

