from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow token obtain with either {email,password} or {username,password}.

    The project uses email as USERNAME_FIELD, but some clients still send `username`.
    """

    def validate(self, attrs):
        # If client sends email instead of username, map it.
        if 'email' in attrs and 'username' not in attrs:
            attrs['username'] = attrs['email']
        data = super().validate(attrs)
        data['is_superuser'] = bool(getattr(self.user, 'is_superuser', False))
        return data
