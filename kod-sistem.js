(function () {
  'use strict';

  var config = window.SITE_CONFIG || {};
  var payment = config.payment || {};
  var formConfig = config.form || {};
  var links = config.links || {};
  var savedFormData = null;

  function formatPrice(price) {
    return Number(price).toLocaleString('ru-RU');
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el && text != null) el.textContent = text;
  }

  function initPricing() {
    var priceStr = formatPrice(payment.price || 0) + ' ' + (payment.currency || '₽');
    setText('priceDisplay', formatPrice(payment.price || 0));
    setText('currencyDisplay', payment.currency || '₽');
    setText('priceLabel', payment.label || '');
    setText('modalPriceConfirm', priceStr);
    setText('modalReferralPrice', priceStr);
    setText('heroPrice', priceStr);
    setText('ctaPrice', priceStr);
  }

  function renderModules() {
    var grid = document.getElementById('modulesGrid');
    var modules = config.modules || [];
    if (!grid || !modules.length) return;

    grid.innerHTML = modules.map(function (m) {
      return (
        '<article class="module-card reveal">' +
          '<span class="module-card__num">' + m.num + '</span>' +
          '<h4 class="module-card__title">' + m.title + '</h4>' +
          '<p class="module-card__text">' + m.text + '</p>' +
        '</article>'
      );
    }).join('');
  }

  function renderFaq() {
    var list = document.getElementById('faqList');
    var faq = config.faq || [];
    if (!list || !faq.length) return;

    list.innerHTML = faq.map(function (item, i) {
      return (
        '<details class="faq-item reveal">' +
          '<summary class="faq-item__q">' + item.q + '</summary>' +
          '<div class="faq-item__a"><p>' + item.a + '</p></div>' +
        '</details>'
      );
    }).join('');
  }

  function buildPaymentUrl() {
    if (!payment.paymentUrl) return '';
    var url = payment.paymentUrl;
    var params = new URLSearchParams();
    if (savedFormData) {
      if (savedFormData.name) params.set('name', savedFormData.name);
      if (savedFormData.phone) params.set('phone', savedFormData.phone);
      if (savedFormData.email) params.set('email', savedFormData.email);
    }
    var qs = params.toString();
    return qs ? url + (url.indexOf('?') > -1 ? '&' : '?') + qs : url;
  }

  function goToPayment() {
    var url = buildPaymentUrl();
    if (url) {
      window.location.href = url;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  var modal = document.getElementById('modal');
  var form = document.getElementById('regForm');
  var step1 = document.getElementById('modalStep1');
  var step2 = document.getElementById('modalStep2');
  var stepDev = document.getElementById('modalStepDev');
  var formError = document.getElementById('formError');

  function resetModal() {
    if (step1) step1.hidden = false;
    if (step2) step2.hidden = true;
    if (stepDev) stepDev.hidden = true;
    if (form) { form.reset(); form.hidden = false; }
    savedFormData = null;
    if (formError) { formError.textContent = ''; formError.hidden = true; }
  }

  function openModal() {
    resetModal();
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    resetModal();
  }

  function showFormError(message) {
    if (!formError) return;
    formError.textContent = message;
    formError.hidden = false;
  }

  function showSuccess() {
    if (step1) step1.hidden = true;
    if (step2) step2.hidden = true;
    if (stepDev) {
      var titleEl = stepDev.querySelector('.modal__title');
      var subtitleEl = stepDev.querySelector('.modal__subtitle');
      if (titleEl) titleEl.textContent = formConfig.successTitle || 'Спасибо!';
      if (subtitleEl) subtitleEl.textContent = formConfig.successMessage || 'Заявка отправлена.';
      stepDev.hidden = false;
    }
  }

  document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', openModal);
  });

  document.querySelectorAll('[data-modal-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (formError) { formError.textContent = ''; formError.hidden = true; }

      savedFormData = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email ? form.email.value.trim() : '',
        telegram: form.telegram ? form.telegram.value.trim() : '',
        consentMailing: !!(form.consent_mailing && form.consent_mailing.checked)
      };

      var endpoint = formConfig.endpoint;
      if (!endpoint) {
        if (payment.enabled && payment.paymentUrl) {
          goToPayment();
        } else {
          showSuccess();
        }
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var btnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Отправка…'; }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: savedFormData.name,
          phone: savedFormData.phone,
          telegram: savedFormData.telegram,
          email: savedFormData.email,
          consentMailing: savedFormData.consentMailing,
          product: config.productTitle || 'Код систем',
          event: {
            format: 'Онлайн · 30 дней',
            price: payment.price,
            currency: payment.currency
          }
        })
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (result) {
          if (!result.ok || !result.data.ok) throw new Error('submit_failed');

          if (payment.enabled && payment.paymentUrl) {
            if (submitBtn) submitBtn.textContent = 'Переход к оплате…';
            goToPayment();
            return;
          }
          showSuccess();
        })
        .catch(function () {
          showFormError('Не удалось отправить заявку. Напишите в Telegram.');
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = btnText; }
        });
    });
  }

  var phoneInput = document.querySelector('input[name="phone"]');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var digits = this.value.replace(/\D/g, '');
      if (digits.startsWith('8')) digits = '7' + digits.slice(1);
      if (!digits.startsWith('7')) digits = '7' + digits;
      var formatted = '+7';
      if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
      if (digits.length >= 4) formatted += ') ' + digits.slice(4, 7);
      if (digits.length >= 7) formatted += '-' + digits.slice(7, 9);
      if (digits.length >= 9) formatted += '-' + digits.slice(9, 11);
      this.value = formatted;
    });
  }

  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('active');
        mobileMenu.classList.remove('open');
      });
    });
  }

  var header = document.getElementById('header');
  window.addEventListener('scroll', function () {
    if (!header) return;
    header.classList.toggle('header--scrolled', window.scrollY > 40);
  }, { passive: true });

  function observeReveals() {
    var els = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      els.forEach(function (el) { observer.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  initPricing();
  renderModules();
  renderFaq();
  observeReveals();
})();
