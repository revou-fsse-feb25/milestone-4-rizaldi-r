import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

/**
 * A mock `ThrottlerGuard` that always allows requests to pass, effectively
 * disabling throttling for testing purposes.
 *
 * Extend the original guard but override the `handleRequest` method.
 * This method is the core of the guard's logic. By returning `true`,
 * the guard let the request continue without checking limits.
 */
@Injectable()
export class MockThrottlerGuard extends ThrottlerGuard {
  protected handleRequest(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
