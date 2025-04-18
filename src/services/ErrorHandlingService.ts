import { toast } from 'sonner';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories
 */
export enum ErrorCategory {
  NETWORK = 'network',
  BLOCKCHAIN = 'blockchain',
  GAME_LOGIC = 'game_logic',
  SECURITY = 'security',
  USER_INPUT = 'user_input',
  SYSTEM = 'system'
}

/**
 * Interface for error details
 */
export interface ErrorDetails {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: number;
  context?: any;
  stackTrace?: string;
  handled: boolean;
  userFriendlyMessage?: string;
  recoveryAttempted?: boolean;
  recoverySuccessful?: boolean;
}

/**
 * Service for handling errors and providing recovery mechanisms
 */
export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errors: ErrorDetails[] = [];
  private errorListeners: ((error: ErrorDetails) => void)[] = [];
  private recoveryStrategies: Map<string, (error: ErrorDetails) => Promise<boolean>> = new Map();
  private maxErrors = 100;
  private telemetryEnabled = true;
  private telemetryEndpoint = import.meta.env.VITE_ERROR_TELEMETRY_ENDPOINT || 'https://telemetry.monad-game.example.com/errors';

  private constructor() {
    // Register global error handler
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // Register default recovery strategies
    this.registerDefaultRecoveryStrategies();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle a global error event
   */
  private handleGlobalError(event: ErrorEvent): void {
    this.handleError({
      message: event.message,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SYSTEM,
      timestamp: Date.now(),
      stackTrace: event.error?.stack,
      handled: false,
      userFriendlyMessage: 'An unexpected error occurred. The game may not function correctly.'
    });
    
    // Prevent the browser from showing its own error dialog
    event.preventDefault();
  }

  /**
   * Handle an unhandled promise rejection
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason;
    
    this.handleError({
      message: error?.message || 'Unhandled promise rejection',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.SYSTEM,
      timestamp: Date.now(),
      stackTrace: error?.stack,
      handled: false,
      userFriendlyMessage: 'An operation failed to complete. Please try again.'
    });
    
    // Prevent the browser from showing its own error dialog
    event.preventDefault();
  }

  /**
   * Register default recovery strategies
   */
  private registerDefaultRecoveryStrategies(): void {
    // Network error recovery
    this.registerRecoveryStrategy(
      'network_connection_lost',
      async (error) => {
        // Attempt to reconnect
        try {
          // This would typically use the WebSocketService or similar
          console.log('Attempting to recover from network error');
          
          // Simulate a reconnection attempt
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Return success (in a real implementation, this would check if reconnection succeeded)
          return Math.random() > 0.3; // 70% success rate for simulation
        } catch (e) {
          console.error('Error during network recovery:', e);
          return false;
        }
      }
    );
    
    // Blockchain transaction error recovery
    this.registerRecoveryStrategy(
      'blockchain_transaction_failed',
      async (error) => {
        // Attempt to resubmit the transaction
        try {
          console.log('Attempting to recover from blockchain transaction error');
          
          // Simulate a transaction resubmission
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Return success
          return Math.random() > 0.4; // 60% success rate for simulation
        } catch (e) {
          console.error('Error during blockchain recovery:', e);
          return false;
        }
      }
    );
    
    // Game state synchronization error recovery
    this.registerRecoveryStrategy(
      'game_state_sync_failed',
      async (error) => {
        // Attempt to resync the game state
        try {
          console.log('Attempting to recover from game state sync error');
          
          // Simulate a state resync
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          // Return success
          return Math.random() > 0.2; // 80% success rate for simulation
        } catch (e) {
          console.error('Error during state sync recovery:', e);
          return false;
        }
      }
    );
  }

  /**
   * Handle an error
   */
  public handleError(error: ErrorDetails): void {
    // Add to error list
    this.errors.unshift(error);
    
    // Trim error list if needed
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
    
    // Notify listeners
    this.notifyErrorListeners(error);
    
    // Send telemetry if enabled
    if (this.telemetryEnabled) {
      this.sendErrorTelemetry(error);
    }
    
    // Show toast for medium, high, and critical errors
    if (error.severity !== ErrorSeverity.LOW) {
      const toastMessage = error.userFriendlyMessage || error.message;
      
      switch (error.severity) {
        case ErrorSeverity.MEDIUM:
          toast.warning(toastMessage, {
            description: error.category === ErrorCategory.NETWORK
              ? 'This may affect game synchronization'
              : 'This may affect some game functionality'
          });
          break;
          
        case ErrorSeverity.HIGH:
          toast.error(toastMessage, {
            description: 'Please save your progress or restart the game'
          });
          break;
          
        case ErrorSeverity.CRITICAL:
          toast.error(toastMessage, {
            description: 'The game cannot continue. Please refresh the page.'
          });
          break;
      }
    }
    
    // Attempt recovery for unhandled errors
    if (!error.handled && error.code && this.recoveryStrategies.has(error.code)) {
      this.attemptRecovery(error);
    }
  }

  /**
   * Attempt to recover from an error
   */
  public async attemptRecovery(error: ErrorDetails): Promise<boolean> {
    if (!error.code || !this.recoveryStrategies.has(error.code)) {
      return false;
    }
    
    error.recoveryAttempted = true;
    
    try {
      const recoveryStrategy = this.recoveryStrategies.get(error.code)!;
      const success = await recoveryStrategy(error);
      
      error.recoverySuccessful = success;
      
      if (success) {
        toast.success('Recovery successful', {
          description: 'The issue has been resolved automatically'
        });
      } else {
        toast.error('Recovery failed', {
          description: 'Please try again or refresh the page'
        });
      }
      
      return success;
    } catch (e) {
      console.error('Error during recovery attempt:', e);
      error.recoverySuccessful = false;
      return false;
    }
  }

  /**
   * Register a recovery strategy for a specific error code
   */
  public registerRecoveryStrategy(
    errorCode: string,
    strategy: (error: ErrorDetails) => Promise<boolean>
  ): void {
    this.recoveryStrategies.set(errorCode, strategy);
  }

  /**
   * Send error telemetry to the server
   */
  private sendErrorTelemetry(error: ErrorDetails): void {
    // In a real implementation, this would send the error to a telemetry server
    if (!this.telemetryEndpoint) return;
    
    try {
      // Remove potentially sensitive information
      const telemetryData = {
        ...error,
        context: undefined // Don't send context data that might contain sensitive info
      };
      
      // Send the data
      fetch(this.telemetryEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(telemetryData),
        // Don't wait for the response
        keepalive: true
      }).catch(e => {
        console.error('Error sending telemetry:', e);
      });
    } catch (e) {
      console.error('Error preparing telemetry:', e);
    }
  }

  /**
   * Add an error listener
   */
  public addErrorListener(listener: (error: ErrorDetails) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove an error listener
   */
  public removeErrorListener(listener: (error: ErrorDetails) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  /**
   * Notify all error listeners
   */
  private notifyErrorListeners(error: ErrorDetails): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    }
  }

  /**
   * Get all errors
   */
  public getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Enable or disable telemetry
   */
  public setTelemetryEnabled(enabled: boolean): void {
    this.telemetryEnabled = enabled;
  }

  /**
   * Create a wrapped version of a function that handles errors
   */
  public wrapWithErrorHandling<T extends (...args: any[]) => any>(
    fn: T,
    errorCode?: string,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      try {
        return fn(...args);
      } catch (error: any) {
        this.handleError({
          message: error?.message || 'An error occurred',
          code: errorCode,
          severity,
          category,
          timestamp: Date.now(),
          stackTrace: error?.stack,
          handled: true,
          context: { args }
        });
        
        throw error; // Re-throw to allow caller to handle
      }
    };
  }

  /**
   * Create a wrapped version of an async function that handles errors
   */
  public wrapAsyncWithErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    errorCode?: string,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      try {
        return await fn(...args);
      } catch (error: any) {
        this.handleError({
          message: error?.message || 'An async error occurred',
          code: errorCode,
          severity,
          category,
          timestamp: Date.now(),
          stackTrace: error?.stack,
          handled: true,
          context: { args }
        });
        
        throw error; // Re-throw to allow caller to handle
      }
    };
  }
}
