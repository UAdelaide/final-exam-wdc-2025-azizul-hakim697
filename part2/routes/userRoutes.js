<script>
  const { createApp } = Vue;
  createApp({
    data() {
      return {
        username: '',
        password: '',
        message: ''
      };
    },
    methods: {
      async login() {
        const res = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.username, password: this.password })
        });

        const data = await res.json();
        if (res.ok) {
          // Redirect based on role
          if (data.user.role === 'owner') {
            window.location.href = '/owner-dashboard.html';
          } else if (data.user.role === 'walker') {
            window.location.href = '/walker-dashboard.html';
          } else {
            this.message = `Unknown role: ${data.user.role}`;
          }
        } else {
          this.message = data.error;
        }
      }
    }
  }).mount('#app');
</script>
