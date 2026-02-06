<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1️⃣ AI Models Registry - Modelos disponibles en el sistema
        Schema::create('ai_models', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique(); // gpt-4o, llama-3-8b, mixtral-8x7b
            $table->string('name', 255); // Display name
            $table->string('provider', 50)->index(); // openai, anthropic, ollama, local
            $table->enum('type', ['chat', 'embeddings', 'vision', 'code', 'multimodal'])->default('chat');
            $table->enum('status', ['active', 'deprecated', 'disabled'])->default('active');

            // Cost configuration (per 1K tokens)
            $table->decimal('cost_per_1k_tokens_in', 10, 6)->default(0);
            $table->decimal('cost_per_1k_tokens_out', 10, 6)->default(0);

            // Model specifications
            $table->unsignedInteger('context_window')->default(4096); // Max tokens
            $table->unsignedInteger('max_output_tokens')->nullable();

            // Capabilities (JSON for flexibility)
            $table->json('capabilities')->nullable(); // {"streaming": true, "function_calling": true, "vision": false}

            // Availability
            $table->json('regions')->nullable(); // ["us-east", "eu-west"]
            $table->boolean('is_default')->default(false);
            $table->unsignedSmallInteger('priority')->default(100); // Lower = higher priority

            // Metadata
            $table->text('description')->nullable();
            $table->string('documentation_url', 500)->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['provider', 'status']);
            $table->index(['type', 'status']);
        });

        // 2️⃣ AI Tools Registry - Catálogo de tools disponibles para la IA
        Schema::create('ai_tools', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique(); // get_quotation_stats, find_client
            $table->string('name', 255); // Display name
            $table->text('description')->nullable();

            // Classification
            $table->enum('type', ['read', 'write', 'action'])->default('read');
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])->default('low');

            // Access control
            $table->json('required_roles')->nullable(); // ["admin", "estimator"]
            $table->json('required_permissions')->nullable(); // ["view_quotes", "manage_clients"]

            // Status
            $table->boolean('is_enabled')->default(true);
            $table->boolean('is_beta')->default(false);

            // Schema/Documentation
            $table->json('parameters_schema')->nullable(); // JSON Schema for parameters
            $table->json('response_schema')->nullable(); // Expected response structure

            // Metadata
            $table->string('category', 100)->nullable()->index(); // quotes, clients, analytics
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['type', 'is_enabled']);
            $table->index(['risk_level', 'is_enabled']);
        });

        // 3️⃣ AI Plan Limits - Límites de IA por plan
        Schema::create('ai_plan_limits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();

            // Request limits
            $table->unsignedBigInteger('max_requests_per_month')->default(1000); // -1 = unlimited
            $table->unsignedBigInteger('max_requests_per_day')->nullable();
            $table->unsignedBigInteger('max_requests_per_hour')->nullable();

            // Token limits
            $table->unsignedBigInteger('max_tokens_per_month')->default(1000000);
            $table->unsignedBigInteger('max_tokens_per_request')->default(4000);
            $table->unsignedBigInteger('max_input_tokens_per_request')->nullable();
            $table->unsignedBigInteger('max_output_tokens_per_request')->nullable();

            // Tool limits
            $table->unsignedSmallInteger('max_tool_calls_per_request')->default(5);

            // Queue priority (for rate limiting)
            $table->unsignedTinyInteger('queue_priority')->default(5); // 1-10, higher = faster

            // Overage handling
            $table->boolean('allow_overage')->default(false);
            $table->decimal('overage_cost_per_1k_tokens', 10, 4)->nullable();
            $table->decimal('overage_cost_per_request', 10, 4)->nullable();

            // Metadata
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Ensure one limit set per plan
            $table->unique('plan_id');
        });

        // 4️⃣ AI Plan Models - Relación plan-modelos permitidos
        Schema::create('ai_plan_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ai_model_id')->constrained('ai_models')->cascadeOnDelete();

            // Override limits for this specific model
            $table->unsignedBigInteger('max_requests_per_month')->nullable();
            $table->unsignedBigInteger('max_tokens_per_month')->nullable();

            $table->boolean('is_default')->default(false);

            $table->timestamps();

            $table->unique(['plan_id', 'ai_model_id']);
        });

        // 5️⃣ AI Plan Tools - Relación plan-tools permitidas
        Schema::create('ai_plan_tools', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ai_tool_id')->constrained('ai_tools')->cascadeOnDelete();

            // Limits específicos para esta tool en este plan
            $table->unsignedInteger('max_calls_per_day')->nullable();
            $table->unsignedInteger('max_calls_per_request')->nullable();

            $table->timestamps();

            $table->unique(['plan_id', 'ai_tool_id']);
        });

        // 6️⃣ AI Usage Daily - Métricas de uso diario por tenant
        Schema::create('ai_usage_daily', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->date('date')->index();

            // Model usage (optional, for detailed tracking)
            $table->foreignId('ai_model_id')->nullable()->constrained('ai_models')->nullOnDelete();

            // Counters
            $table->unsignedBigInteger('requests_count')->default(0);
            $table->unsignedBigInteger('successful_requests')->default(0);
            $table->unsignedBigInteger('failed_requests')->default(0);

            // Token metrics
            $table->unsignedBigInteger('tokens_in')->default(0);
            $table->unsignedBigInteger('tokens_out')->default(0);
            $table->unsignedBigInteger('total_tokens')->default(0);

            // Tool invocations (count only, not content)
            $table->unsignedBigInteger('tool_calls_count')->default(0);
            $table->json('tools_invoked')->nullable(); // {"find_client": 15, "get_stats": 8}

            // Performance metrics
            $table->unsignedBigInteger('total_latency_ms')->default(0); // Sum for avg calculation
            $table->unsignedInteger('timeout_count')->default(0);
            $table->unsignedInteger('rate_limit_hits')->default(0);

            // Cost tracking
            $table->decimal('cost_estimated', 12, 4)->default(0);

            // Metadata
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Composite indexes for queries
            $table->unique(['tenant_id', 'date', 'ai_model_id']);
            $table->index(['date', 'tenant_id']);
        });

        // 7️⃣ AI Fallback Rules - Reglas de fallback cuando algo falla
        Schema::create('ai_fallback_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->text('description')->nullable();

            // Primary model
            $table->foreignId('primary_model_id')->constrained('ai_models')->cascadeOnDelete();

            // Fallback model
            $table->foreignId('fallback_model_id')->constrained('ai_models')->cascadeOnDelete();

            // Trigger conditions
            $table->json('trigger_on')->nullable(); // ["timeout", "rate_limit", "error_5xx", "model_unavailable"]

            // Conditions
            $table->unsignedInteger('timeout_threshold_ms')->nullable(); // Trigger if latency > X
            $table->unsignedTinyInteger('error_rate_threshold')->nullable(); // Trigger if error rate > X%

            // Behavior
            $table->unsignedTinyInteger('retry_count')->default(1);
            $table->unsignedInteger('retry_delay_ms')->default(1000);
            $table->boolean('preserve_context')->default(true);

            // Scope
            $table->foreignId('plan_id')->nullable()->constrained()->nullOnDelete(); // null = global
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete(); // null = all tenants

            // Status
            $table->boolean('is_enabled')->default(true);
            $table->unsignedSmallInteger('priority')->default(100); // Lower = checked first

            $table->timestamps();

            // Indexes
            $table->index(['is_enabled', 'priority']);
            $table->index(['primary_model_id', 'is_enabled']);
        });

        // 8️⃣ AI Policies - Políticas y guardrails sin ver contenido
        Schema::create('ai_policies', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique(); // max_request_size, deny_suspended_tenants
            $table->string('name', 255);
            $table->text('description')->nullable();

            // Policy type
            $table->enum('type', [
                'rate_limit',      // Límites de velocidad
                'access_control',  // Control de acceso
                'resource_limit',  // Límites de recursos
                'security',        // Seguridad
                'compliance',      // Cumplimiento
            ])->default('resource_limit');

            // Policy configuration (flexible JSON)
            $table->json('config')->nullable();
            /*
             * Examples:
             * rate_limit: {"requests_per_minute": 60, "burst_limit": 10}
             * access_control: {"block_suspended": true, "require_verified_email": true}
             * resource_limit: {"max_request_size_kb": 100, "max_tool_calls": 10}
             * security: {"require_mfa_for_write_tools": true}
             * compliance: {"log_all_requests": true, "data_retention_days": 90}
             */

            // Enforcement
            $table->enum('action', ['block', 'warn', 'log', 'throttle'])->default('block');
            $table->string('error_message', 500)->nullable();

            // Scope
            $table->foreignId('plan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();

            // Status
            $table->boolean('is_enabled')->default(true);
            $table->boolean('is_system')->default(false); // System policies can't be deleted
            $table->unsignedSmallInteger('priority')->default(100);

            $table->timestamps();

            // Indexes
            $table->index(['type', 'is_enabled']);
            $table->index(['is_enabled', 'priority']);
        });

        // 9️⃣ AI Provider Configs - Configuración de proveedores (solo master)
        Schema::create('ai_provider_configs', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 50)->unique(); // openai, anthropic, ollama, local
            $table->string('name', 255);

            // Status
            $table->boolean('is_enabled')->default(true);
            $table->enum('status', ['operational', 'degraded', 'down', 'maintenance'])->default('operational');

            // Configuration (encrypted sensitive data)
            $table->text('api_endpoint')->nullable();
            $table->text('api_key_encrypted')->nullable(); // Encrypted API key
            $table->string('api_version', 50)->nullable();

            // Rate limits from provider
            $table->unsignedInteger('rate_limit_rpm')->nullable(); // Requests per minute
            $table->unsignedInteger('rate_limit_tpm')->nullable(); // Tokens per minute

            // Health monitoring
            $table->timestamp('last_health_check')->nullable();
            $table->decimal('avg_latency_ms', 10, 2)->nullable();
            $table->decimal('error_rate', 5, 2)->nullable();

            // Metadata
            $table->json('metadata')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_provider_configs');
        Schema::dropIfExists('ai_policies');
        Schema::dropIfExists('ai_fallback_rules');
        Schema::dropIfExists('ai_usage_daily');
        Schema::dropIfExists('ai_plan_tools');
        Schema::dropIfExists('ai_plan_models');
        Schema::dropIfExists('ai_plan_limits');
        Schema::dropIfExists('ai_tools');
        Schema::dropIfExists('ai_models');
    }
};
