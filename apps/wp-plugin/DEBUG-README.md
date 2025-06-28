# Team556 Pay Plugin – Debug Readme

This document tracks all WooCommerce logging points that have been **disabled (commented)** in order to keep the production logs clean while still preserving every logging statement for future troubleshooting.  
If you want to re-enable logging, simply **uncomment** the lines listed below.

---

## 1. `includes/class-team556-pay-gateway.php`
| Line (approx.) | Method / Context | Disabled Call |
|----------------|------------------|---------------|
| 48-52          | `log_wc()` helper | `$this->logger->log(...)` |
| 126-132        | `__construct()`   | `$this->log_wc("Team556 Pay Gateway constructor executed", …)` |
| 149-156        | `log_debug()`     | `$this->logger->debug(...)` |
| 165-177        | `log()` helper    | `$this->logger->log(...)` |
| 960-988        | `static_ajax_check_order_status_handler()` | `$logger->debug()`, `$logger->error()`, `$logger->warning()` |
| 1250-1340      | `ajax_check_order_status()` | every `$this->log_wc(...)` invocation |

## 2. `includes/class-team556-pay-verifier.php`
| Line (approx.) | Method | Disabled Call |
|----------------|--------|---------------|
| 87-93          | `log()` helper | `$this->logger->debug(...)` |

## 3. `includes/class-team556-pay.php`
| Line (approx.) | Method / Context | Disabled Call |
|----------------|------------------|---------------|
| 49-55          | `__construct()`   | `$this->logger->debug(...)` |
| 70-103         | `__construct()` (rewrite-rules & hooks) | `$this->logger->debug(...)` |
| 344-400        | `register_rest_routes()` | multiple `$this->logger->debug(...)` |
| 395            | `proxy_webhook_handler()` | `$this->logger->debug(...)` |
| 432-450        | `get_unique_request_id()` | `$this->logger->debug(...)` |
| 514            | `rest_healthcheck()` | `$this->logger->debug(...)` |
| 849-856        | `ajax_check_payment_status()` | `$verify_logger->debug(...)` |
| 498-514        | `log_order_status()` | `$this->order_status_logger->add(...)` – **entire order-status log disabled** |

> **Tip:** searching for `// $this->logger->` or `// $logger->` inside the plugin will reveal every disabled line.

---

## How to Re-enable Logging
1. Open the file and locate the **commented** logging line (each one starts with `//`).  
2. Remove the `//` prefix (and one leading space) to uncomment the line.  
3. Save the file and clear any server/opcache, then reload the page you want to debug.
4. Logs will appear in **WooCommerce → Status → Logs** under the source names:  
   * `team556-pay-gateway`  
   * `team556-pay`  
   * `team556-pay-ajax`  
   * `team556-order-status`  
   * `team556-pay-webhook`  
   * `team556-confirmation`  
5. When finished debugging, re-comment the line(s) or roll back this list.

---

### Quick one-shot re-enable / disable
If you are comfortable with the command line you can toggle **all** the commented log lines at once from the repository root.

• Re-enable every logger line (remove leading `//`):
```bash
# mac / Linux – dry-run first!  Remove `echo` to perform.
grep -rl --exclude='*.min.js' -E '^\s*// .*logger' apps/wp-plugin \
  | while read f; do echo "Uncommenting in $f"; sed -i '' -E 's#^\s*// ##' "$f"; done
```

• Disable them again (prepend `// ` to lines that contain logger calls):
```bash
# Re-disable – dry-run first!
grep -rl --exclude='*.min.js' -E '\$.*(logger|order_status_logger)' apps/wp-plugin \
  | while read f; do echo "Commenting in $f"; sed -i '' -E 's#^(\s*)([^/].*(logger|order_status_logger))#\1// \2#' "$f"; done
```

> Always run a dry-run (remove the `echo` lines when happy) and commit before executing these bulk changes.

---

## Safety Note
While logging can be invaluable during development, leaving verbose logging enabled in production:
* Creates very large log files.
* May expose sensitive transaction data.
* Slightly degrades performance.

Always ensure you disable logging again after diagnostics.

---

_Last updated: 2025-06-28_
