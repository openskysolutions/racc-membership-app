/**
 * Yearly Voting Service
 * API client for yearly voting functionality (October 1-20 voting window)
 */

import { apiFetch, handle401Redirect } from './apiClient';

export interface YearlyVotingNomination {
  id: number;
  name: string;
  businessName: string;
  reason: string;
  category: 'business_of_month' | 'customer_service_superstar';
  monthlyVoteCount: number;
  winningMonth: number;
  votingMonth: string;
  createdAt: string;
}

export interface YearlyVotingPeriod {
  canVote: boolean;
  votingYear?: number;
  deadline?: Date;
  error?: string;
  nominations?: {
    business_of_month: YearlyVotingNomination[];
    customer_service_superstar: YearlyVotingNomination[];
  };
}

export interface YearlyVotingStatus {
  canVote: boolean;
  votingYear?: number;
  deadline?: Date;
  error?: string;
  hasVoted?: {
    business_of_month: boolean;
    customer_service_superstar: boolean;
  };
  votes?: {
    business_of_month: {
      nominationId: number;
      businessName: string;
      votedAt: Date;
    } | null;
    customer_service_superstar: {
      nominationId: number;
      name: string;
      businessName: string;
      votedAt: Date;
    } | null;
  };
}

export interface YearlyWinners {
  year: number;
  business_of_month: {
    id: number;
    name: string;
    businessName: string;
    reason: string;
    voteCount: number;
    createdAt: string;
  } | null;
  customer_service_superstar: {
    id: number;
    name: string;
    businessName: string;
    reason: string;
    voteCount: number;
    createdAt: string;
  } | null;
}

/**
 * Get monthly winners available for yearly voting (Oct 1-20 only)
 */
export async function getYearlyVotingNominations(): Promise<YearlyVotingPeriod> {
  try {
    const response = await apiFetch('/nominations/yearly/voting', {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        handle401Redirect();
        throw new Error('Unauthorized');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get yearly voting nominations');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting yearly voting nominations:', error);
    throw error;
  }
}

/**
 * Get current user's yearly voting status
 */
export async function getYearlyVotingStatus(): Promise<YearlyVotingStatus> {
  try {
    const response = await apiFetch('/nominations/yearly/status', {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        handle401Redirect();
        throw new Error('Unauthorized');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get yearly voting status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting yearly voting status:', error);
    throw error;
  }
}

/**
 * Vote on a yearly winner (Oct 1-20 only)
 */
export async function voteOnYearlyNomination(nominationId: number): Promise<void> {
  try {
    const response = await apiFetch(`/nominations/${nominationId}/vote/yearly`, {
      method: 'POST',
    });

    if (!response.ok) {
      if (response.status === 401) {
        handle401Redirect();
        throw new Error('Unauthorized');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit yearly vote');
    }
  } catch (error) {
    console.error('Error voting on yearly nomination:', error);
    throw error;
  }
}

/**
 * Get previous yearly winners (for display outside voting period)
 */
export async function getYearlyWinners(year?: number): Promise<YearlyWinners> {
  try {
    const url = year ? `/nominations/yearly/winners?year=${year}` : '/nominations/yearly/winners';
    const response = await apiFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        handle401Redirect();
        throw new Error('Unauthorized');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get yearly winners');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting yearly winners:', error);
    throw error;
  }
}
