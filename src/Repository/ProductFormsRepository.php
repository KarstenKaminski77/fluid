<?php

namespace App\Repository;

use App\Entity\ProductForms;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ProductForms>
 *
 * @method ProductForms|null find($id, $lockMode = null, $lockVersion = null)
 * @method ProductForms|null findOneBy(array $criteria, array $orderBy = null)
 * @method ProductForms[]    findAll()
 * @method ProductForms[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ProductFormsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ProductForms::class);
    }

    public function add(ProductForms $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(ProductForms $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findAllAsc()
    {
        $queryBuilder = $this->createQueryBuilder('p')
            ->orderBy('p.name', 'ASC');
        return [$queryBuilder->getQuery(), $queryBuilder->getQuery()->getResult()];
    }

//    /**
//     * @return ProductForms[] Returns an array of ProductForms objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('p')
//            ->andWhere('p.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('p.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?ProductForms
//    {
//        return $this->createQueryBuilder('p')
//            ->andWhere('p.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
