import * as crypto from 'crypto';

export class HashSigner {
  private static readonly AVAILABLE_HASH_ALGORITHMS: string[] = [
    'RSA-MD5',
    'RSA-RIPEMD160',
    'RSA-SHA1',
    'RSA-SHA1-2',
    'RSA-SHA224',
    'RSA-SHA256',
    'RSA-SHA3-224',
    'RSA-SHA3-256',
    'RSA-SHA3-384',
    'RSA-SHA3-512',
    'RSA-SHA384',
    'RSA-SHA512',
    'RSA-SHA512/224',
    'RSA-SHA512/256',
    'RSA-SM3',
    'blake2b512',
    'blake2s256',
    'id-rsassa-pkcs1-v1_5-with-sha3-224',
    'id-rsassa-pkcs1-v1_5-with-sha3-256',
    'id-rsassa-pkcs1-v1_5-with-sha3-384',
    'id-rsassa-pkcs1-v1_5-with-sha3-512',
    'md5',
    'md5-sha1',
    'md5WithRSAEncryption',
    'ripemd',
    'ripemd160',
    'ripemd160WithRSA',
    'rmd160',
    'sha1',
    'sha1WithRSAEncryption',
    'sha224',
    'sha224WithRSAEncryption',
    'sha256',
    'sha256WithRSAEncryption',
    'sha3-224',
    'sha3-256',
    'sha3-384',
    'sha3-512',
    'sha384',
    'sha384WithRSAEncryption',
    'sha512',
    'sha512-224',
    'sha512-224WithRSAEncryption',
    'sha512WithRSAEncryption',
    'shake128',
    'shake256',
    'sm3',
    'sm3WithRSAEncryption',
    'ssl3-md5',
    'ssl3-sha1'
  ];

  /**
   * 从可用算法中随机选择指定数量的哈希算法。
   * @param count 要选择的算法数量。
   * @returns 随机选择的哈希算法数组。
   */
  private static selectRandomAlgorithms(count: number): string[] {
    const shuffled = [...HashSigner.AVAILABLE_HASH_ALGORITHMS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * 使用随机选择的哈希算法对数据进行签名。
   * @param data 要签名的数据。
   * @param numAlgorithms 要使用的算法数量，默认为4。
   * @returns 包含每个算法签名的对象。
   */
  public static signDataWithRandomHashes(data: string, numAlgorithms: number = 4): { [key: string]: string } {
    const selectedAlgorithms = HashSigner.selectRandomAlgorithms(numAlgorithms);
    const signatures: { [key: string]: string } = {};

    for (const algorithm of selectedAlgorithms) {
      try {
        const hash = crypto.createHash(algorithm).update(data).digest('base64');
        signatures[algorithm] = hash;
      } catch (error) {
        console.warn(`Algorithm ${algorithm} not supported or failed:`, error.message);
        signatures[algorithm] = `Error: ${error.message}`;
      }
    }
    return signatures;
  }
}