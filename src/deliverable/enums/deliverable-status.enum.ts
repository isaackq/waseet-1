export enum DeliverableStatus {
  PENDING = 'PENDING', // Freelancer uploaded, waiting for client review
  RESUBMITTED = 'RESUBMITTED', // Freelancer updated work after a revision request
  APPROVED = 'APPROVED', // Client approved
  REVISION_REQUESTED = 'REVISION_REQUESTED', // Client requested changes
  DISPUTED = 'DISPUTED', // Client disputed/rejected
}
