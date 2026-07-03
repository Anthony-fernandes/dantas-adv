"""Testes do validador CNJ (Resolução CNJ 65/2008)."""
from django.test import SimpleTestCase

from apps.processes.cnj import cnj_segment_label, format_cnj, is_valid_cnj, strip_cnj


def make_cnj(seq: str, year: str, segment: str, court: str, origin: str) -> str:
    """Gera um CNJ com dígito verificador correto (mod 97-10)."""
    base = int(seq + year + segment + court + origin + '00')
    dv = 98 - (base % 97)
    return f'{seq}-{dv:02d}.{year}.{segment}.{court}.{origin}'


class CnjValidationTests(SimpleTestCase):
    def test_valid_generated_numbers(self):
        cases = [
            make_cnj('0001234', '2024', '8', '26', '0100'),  # TJSP
            make_cnj('0005678', '2024', '5', '02', '0001'),  # TRT-2
            make_cnj('0000001', '2020', '4', '03', '6100'),  # JF SP
            make_cnj('9999999', '2025', '1', '00', '0000'),  # STF
        ]
        for cnj in cases:
            with self.subTest(cnj=cnj):
                self.assertTrue(is_valid_cnj(cnj))

    def test_wrong_check_digit_rejected(self):
        valid = make_cnj('0001234', '2024', '8', '26', '0100')
        digits = strip_cnj(valid)
        wrong_dv = (int(digits[7:9]) + 1) % 100
        tampered = digits[:7] + f'{wrong_dv:02d}' + digits[9:]
        self.assertFalse(is_valid_cnj(tampered))

    def test_wrong_length_rejected(self):
        self.assertFalse(is_valid_cnj(''))
        self.assertFalse(is_valid_cnj('123'))
        self.assertFalse(is_valid_cnj('0' * 19))
        self.assertFalse(is_valid_cnj('0' * 21))

    def test_segment_zero_rejected(self):
        base = int('0001234' + '2024' + '0' + '26' + '0100' + '00')
        dv = 98 - (base % 97)
        self.assertFalse(is_valid_cnj(f'0001234-{dv:02d}.2024.0.26.0100'))

    def test_accepts_unformatted_digits(self):
        valid = make_cnj('0001234', '2024', '8', '26', '0100')
        self.assertTrue(is_valid_cnj(strip_cnj(valid)))

    def test_format_cnj(self):
        self.assertEqual(format_cnj('00012345620248260100'), '0001234-56.2024.8.26.0100')
        # comprimento errado devolve original
        self.assertEqual(format_cnj('123'), '123')

    def test_segment_label(self):
        valid = make_cnj('0001234', '2024', '8', '26', '0100')
        self.assertEqual(cnj_segment_label(valid), 'Justiça Estadual')
