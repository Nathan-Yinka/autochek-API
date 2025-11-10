import { Offer } from '../entities/offer.entity';
import { OfferResponseDto } from '../dto/offer-response.dto';
import { LoanApplicationMapper } from '../../loans/mappers/loan-application.mapper';

export class OfferMapper {
  static toResponseDto(offer: Offer): OfferResponseDto {
    return {
      id: offer.id,
      loanApplicationId: offer.loanApplicationId,
      admin: offer.admin ? LoanApplicationMapper.toUserSummary(offer.admin) : undefined,
      lenderCode: offer.lenderCode,
      offeredLoanAmount: offer.offeredLoanAmount,
      apr: offer.apr,
      termMonths: offer.termMonths,
      monthlyPayment: offer.monthlyPayment,
      totalInterest: offer.totalInterest,
      ltvAtOffer: offer.ltvAtOffer,
      status: offer.status,
      expiresAt: offer.expiresAt,
      notes: offer.notes,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };
  }

  static toResponseDtoArray(offers: Offer[]): OfferResponseDto[] {
    return offers.map(offer => this.toResponseDto(offer));
  }
}

