import {Page} from '@playwright/test';

export interface InjectionTestResult {
  method: string;
  success: boolean;
  blocked: boolean;
  error?: string;
  details?: any;
}

export class InjectionHelpers {
  constructor(private page: Page) {}

  async testScriptInjection(payload: string): Promise<InjectionTestResult> {
    try {
      const result = await this.page.evaluate(code => {
        try {
          const script = document.createElement('script');
          script.textContent = code;
          document.head.appendChild(script);

          return {executed: true, blocked: false};
        } catch (error) {
          return {
            executed: false,
            blocked: true,
            error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error),
          };
        }
      }, payload);

      return {
        method: 'script-injection',
        success: result.executed,
        blocked: result.blocked,
        details: result,
      };
    } catch (error) {
      return {
        method: 'script-injection',
        success: false,
        blocked: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testEvalInjection(payload: string): Promise<InjectionTestResult> {
    try {
      const result = await this.page.evaluate(code => {
        try {
          const result = eval(code); // NOSONAR - Intentional eval for security testing
          return {executed: true, blocked: false, result};
        } catch (error) {
          return {executed: false, blocked: true, error: error instanceof Error ? error.message : String(error)};
        }
      }, payload);

      return {
        method: 'eval-injection',
        success: result.executed,
        blocked: result.blocked,
        details: result,
      };
    } catch (error) {
      return {
        method: 'eval-injection',
        success: false,
        blocked: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testFunctionInjection(payload: string): Promise<InjectionTestResult> {
    try {
      const result = await this.page.evaluate(code => {
        try {
          const func = new Function(code); // NOSONAR - Intentional Function constructor for security testing
          const result = func();
          return {executed: true, blocked: false, result};
        } catch (error) {
          return {executed: false, blocked: true, error: error instanceof Error ? error.message : String(error)};
        }
      }, payload);

      return {
        method: 'function-injection',
        success: result.executed,
        blocked: result.blocked,
        details: result,
      };
    } catch (error) {
      return {
        method: 'function-injection',
        success: false,
        blocked: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testTimerInjection(payload: string): Promise<InjectionTestResult> {
    try {
      const result = await this.page.evaluate(code => {
        try {
          const executed = false;
          const timer = setTimeout(code, 0); // NOSONAR - Intentional setTimeout with string for security testing

          return new Promise(resolve => {
            setTimeout(() => {
              clearTimeout(timer);
              resolve({executed, blocked: !executed});
            }, 100);
          });
        } catch (error) {
          return {executed: false, blocked: true, error: error instanceof Error ? error.message : String(error)};
        }
      }, payload);

      return {
        method: 'timer-injection',
        success: (result as any).executed,
        blocked: (result as any).blocked,
        details: result,
      };
    } catch (error) {
      return {
        method: 'timer-injection',
        success: false,
        blocked: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testInnerHTMLInjection(payload: string): Promise<InjectionTestResult> {
    try {
      const result = await this.page.evaluate(code => {
        try {
          const div = document.createElement('div');
          div.innerHTML = `<script>${code}</script>`;
          document.body.appendChild(div);

          const scripts = div.querySelectorAll('script');
          return {
            executed: scripts.length > 0,
            blocked: scripts.length === 0,
            scriptCount: scripts.length,
          };
        } catch (error) {
          return {executed: false, blocked: true, error: error instanceof Error ? error.message : String(error)};
        }
      }, payload);

      return {
        method: 'innerHTML-injection',
        success: result.executed,
        blocked: result.blocked,
        details: result,
      };
    } catch (error) {
      return {
        method: 'innerHTML-injection',
        success: false,
        blocked: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testWebAssemblyInjection(): Promise<InjectionTestResult> {
    try {
      const result = await this.page.evaluate(() => {
        try {
          const wasmCode = new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x07, 0x01, 0x60, 0x00, 0x01, 0x7f, 0x03, 0x02, 0x01,
            0x00, 0x07, 0x07, 0x01, 0x03, 0x72, 0x75, 0x6e, 0x00, 0x00, 0x0a, 0x06, 0x01, 0x04, 0x00, 0x41, 0x2a, 0x0b,
          ]);

          const module = new WebAssembly.Module(wasmCode);
          const instance = new WebAssembly.Instance(module);

          return {
            executed: true,
            blocked: false,
            wasmSupported: typeof WebAssembly !== 'undefined',
          };
        } catch (error) {
          return {
            executed: false,
            blocked: true,
            error: error instanceof Error ? error.message : String(error),
            wasmSupported: typeof WebAssembly !== 'undefined',
          };
        }
      });

      return {
        method: 'webassembly-injection',
        success: result.executed,
        blocked: result.blocked,
        details: result,
      };
    } catch (error) {
      return {
        method: 'webassembly-injection',
        success: false,
        blocked: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async runInjectionTests(): Promise<InjectionTestResult[]> {
    const maliciousPayload = `
      try {
        window.__injectionTest = true;
        if (typeof require !== 'undefined') {
          const fs = require('fs');
          window.__fsAccess = true;
        }
      } catch (e) {
        window.__injectionBlocked = true;
      }
    `;

    const tests = [
      await this.testScriptInjection(maliciousPayload),
      await this.testEvalInjection(maliciousPayload),
      await this.testFunctionInjection(maliciousPayload),
      await this.testTimerInjection(maliciousPayload),
      await this.testInnerHTMLInjection(maliciousPayload),
      await this.testWebAssemblyInjection(),
    ];

    return tests;
  }

  static getMaliciousPayloads(): Record<string, string> {
    return {
      requireAccess: `
        try {
          const fs = require('fs');
          window.__requireTest = 'success';
        } catch (e) {
          window.__requireTest = 'blocked';
        }
      `,

      processAccess: `
        try {
          const proc = process;
          window.__processTest = proc.version;
        } catch (e) {
          window.__processTest = 'blocked';
        }
      `,

      fileSystemAccess: `
        try {
          const fs = require('fs');
          fs.readFileSync('/etc/passwd');
          window.__fsTest = 'success';
        } catch (e) {
          window.__fsTest = 'blocked';
        }
      `,

      childProcessAccess: `
        try {
          const {exec} = require('child_process');
          exec('whoami', () => {});
          window.__execTest = 'success';
        } catch (e) {
          window.__execTest = 'blocked';
        }
      `,
    };
  }
}
