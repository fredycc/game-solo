export class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;
  private isReleasing: boolean = false;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private async handleVisibilityChange() {
    if (this.wakeLock !== null && document.visibilityState === 'visible') {
      await this.requestWakeLock();
    }
  }

  public async requestWakeLock() {
    if (this.wakeLock) return; // Already active

    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        // console.log('Wake Lock is active');

        this.wakeLock.addEventListener('release', () => {
          // console.log('Wake Lock has been released');
          // Only nullify if we didn't initiate the release
          if (!this.isReleasing) {
            this.wakeLock = null;
          }
        });
      } catch (err: unknown) {
        const error = err as Error;
        console.warn(`Wake Lock error: ${error.name}, ${error.message}`);
      }
    } else {
      console.warn('Wake Lock API not supported');
    }
  }

  public async releaseWakeLock() {
    if (this.wakeLock !== null) {
      this.isReleasing = true;
      try {
        await this.wakeLock.release();
      } catch (err) {
        console.warn('Error releasing wake lock', err);
      }
      this.wakeLock = null;
      this.isReleasing = false;
    }
  }

  public cleanup() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.releaseWakeLock();
  }
}

export const wakeLockManager = new WakeLockManager();
