interface ModerationAction {
  id: string;
  contentId: string;
  contentType: 'news' | 'event' | 'job' | 'discussion' | 'comment';
  action: 'approve' | 'reject' | 'flag' | 'hide' | 'delete';
  moderatorId: string;
  reason?: string;
  createdAt: string;
}

interface ContentReport {
  id: string;
  contentId: string;
  contentType: 'news' | 'event' | 'job' | 'discussion' | 'comment';
  reporterId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface ModerationQueue {
  id: string;
  contentId: string;
  contentType: 'news' | 'event' | 'job' | 'discussion' | 'comment';
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  priority: 'low' | 'medium' | 'high';
}

export class ModerationService {
  private actions: Map<string, ModerationAction> = new Map();
  private reports: Map<string, ContentReport> = new Map();
  private queue: Map<string, ModerationQueue> = new Map();
  private nextId = 1;

  constructor() {
    // Initialize with sample data
  }

  /**
   * Submit content for moderation
   */
  async submitForModeration(
    contentId: string,
    contentType: 'news' | 'event' | 'job' | 'discussion' | 'comment',
    submittedBy: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<ModerationQueue> {
    const id = `mod_${this.nextId++}`;
    const moderationItem: ModerationQueue = {
      id,
      contentId,
      contentType,
      status: 'pending',
      submittedBy,
      submittedAt: new Date().toISOString(),
      priority
    };

    this.queue.set(id, moderationItem);
    return moderationItem;
  }

  /**
   * Review and moderate content
   */
  async moderateContent(
    moderationId: string,
    moderatorId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<ModerationAction> {
    const queueItem = this.queue.get(moderationId);
    if (!queueItem) {
      throw new Error('Moderation item not found');
    }

    // Update queue item
    queueItem.status = action === 'approve' ? 'approved' : 'rejected';
    queueItem.reviewedBy = moderatorId;
    queueItem.reviewedAt = new Date().toISOString();

    // Create moderation action record
    const actionId = `act_${this.nextId++}`;
    const moderationAction: ModerationAction = {
      id: actionId,
      contentId: queueItem.contentId,
      contentType: queueItem.contentType,
      action,
      moderatorId,
      reason,
      createdAt: new Date().toISOString()
    };

    this.actions.set(actionId, moderationAction);
    return moderationAction;
  }

  /**
   * Report content for review
   */
  async reportContent(
    contentId: string,
    contentType: 'news' | 'event' | 'job' | 'discussion' | 'comment',
    reporterId: string,
    reason: string,
    details?: string
  ): Promise<ContentReport> {
    const id = `rep_${this.nextId++}`;
    const report: ContentReport = {
      id,
      contentId,
      contentType,
      reporterId,
      reason,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.reports.set(id, report);
    
    // Auto-submit to moderation queue if serious
    if (reason.includes('inappropriate') || reason.includes('spam')) {
      await this.submitForModeration(contentId, contentType, reporterId, 'high');
    }

    return report;
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(filters?: {
    status?: 'pending' | 'approved' | 'rejected';
    contentType?: 'news' | 'event' | 'job' | 'discussion' | 'comment';
    priority?: 'low' | 'medium' | 'high';
  }): Promise<ModerationQueue[]> {
    let items = Array.from(this.queue.values());

    if (filters) {
      if (filters.status) {
        items = items.filter(item => item.status === filters.status);
      }
      if (filters.contentType) {
        items = items.filter(item => item.contentType === filters.contentType);
      }
      if (filters.priority) {
        items = items.filter(item => item.priority === filters.priority);
      }
    }

    return items.sort((a, b) => {
      // Sort by priority (high first) then by submission date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });
  }

  /**
   * Get content reports
   */
  async getReports(filters?: {
    status?: 'pending' | 'reviewed' | 'dismissed';
    contentType?: 'news' | 'event' | 'job' | 'discussion' | 'comment';
  }): Promise<ContentReport[]> {
    let reports = Array.from(this.reports.values());

    if (filters) {
      if (filters.status) {
        reports = reports.filter(report => report.status === filters.status);
      }
      if (filters.contentType) {
        reports = reports.filter(report => report.contentType === filters.contentType);
      }
    }

    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Review a report
   */
  async reviewReport(
    reportId: string,
    reviewerId: string,
    action: 'dismiss' | 'escalate',
    notes?: string
  ): Promise<ContentReport> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    report.status = action === 'dismiss' ? 'dismissed' : 'reviewed';
    report.reviewedBy = reviewerId;
    report.reviewedAt = new Date().toISOString();

    if (action === 'escalate') {
      // Add to moderation queue
      await this.submitForModeration(
        report.contentId,
        report.contentType,
        reviewerId,
        'high'
      );
    }

    return report;
  }

  /**
   * Get moderation history for content
   */
  async getModerationHistory(contentId: string): Promise<ModerationAction[]> {
    return Array.from(this.actions.values())
      .filter(action => action.contentId === contentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<{
    pendingQueue: number;
    pendingReports: number;
    actionsToday: number;
    totalActions: number;
  }> {
    const pendingQueue = Array.from(this.queue.values())
      .filter(item => item.status === 'pending').length;

    const pendingReports = Array.from(this.reports.values())
      .filter(report => report.status === 'pending').length;

    const today = new Date().toDateString();
    const actionsToday = Array.from(this.actions.values())
      .filter(action => new Date(action.createdAt).toDateString() === today).length;

    return {
      pendingQueue,
      pendingReports,
      actionsToday,
      totalActions: this.actions.size
    };
  }
}
