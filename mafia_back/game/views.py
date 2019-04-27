from django.shortcuts import get_object_or_404
from django.views.generic import RedirectView
from .models import ActivationSource


class Activation(RedirectView):
    # redirect to success
    url = 'https://google.com'

    def get(self, request, *args, **kwargs):
        activation_source = get_object_or_404(ActivationSource, key=request.GET['token'])
        activation_source.user.is_active = True
        activation_source.user.save()
        activation_source.delete()
        return super().get(request, *args, **kwargs)
