<template>
  <teleport to="body">
    <div v-if="visible" class="toast-container" :class="position">
      <div class="toast-notification" :class="type">
        <div class="toast-content">
          <div class="toast-message">{{ message }}</div>
          <button @click="hide" class="toast-close">&times;</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'ToastNotification',
  props: {
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'info', 'warning'].includes(value)
    },
    duration: {
      type: Number,
      default: 4000
    },
    position: {
      type: String,
      default: 'bottom-right',
      validator: (value) => ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value)
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'hidden'],
  watch: {
    visible(newValue) {
      if (newValue) {
        this.startTimer();
      } else {
        this.clearTimer();
      }
    }
  },
  data() {
    return {
      timer: null
    };
  },
  methods: {
    hide() {
      this.clearTimer();
      this.$emit('update:visible', false);
      this.$emit('hidden');
    },
    startTimer() {
      if (this.duration > 0) {
        this.clearTimer();
        this.timer = setTimeout(() => {
          this.hide();
        }, this.duration);
      }
    },
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  },
  mounted() {
    if (this.visible) {
      this.startTimer();
    }
  },
  beforeUnmount() {
    this.clearTimer();
  }
}
</script>

<style>
.toast-container {
  position: fixed;
  z-index: 40;
  pointer-events: none;
}

.toast-container.top-left {
  top: 20px;
  left: 20px;
}

.toast-container.top-right {
  top: 20px;
  right: 20px;
}

.toast-container.bottom-left {
  bottom: 20px;
  left: 20px;
}

.toast-container.bottom-right {
  bottom: 20px;
  right: 20px;
}

.toast-notification {
  min-width: 250px;
  max-width: 400px;
  margin-top: 10px;
  pointer-events: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: toast-slide-in 0.3s ease-out forwards;
  color: #fff;
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
}

.toast-message {
  flex: 1;
  padding-right: 10px;
}

.toast-close {
  background: transparent;
  border: none;
  color: #fff;
  opacity: 0.7;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.toast-close:hover {
  opacity: 1;
}

.toast-notification.success {
  background-color: #2a9d8f;
}

.toast-notification.error {
  background-color: var(--danger-color, #dc3545);
}

.toast-notification.info {
  background-color: var(--accent-color, #007bff);
}

.toast-notification.warning {
  background-color: #fd7e14;
}

@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .toast-notification {
    min-width: auto;
    width: calc(100vw - 40px);
    max-width: calc(100vw - 40px);
  }
  
  .toast-container.top-left,
  .toast-container.top-right,
  .toast-container.bottom-left,
  .toast-container.bottom-right {
    left: 20px;
    right: 20px;
  }
}
</style>