<?php

namespace App\Repository;

use App\Entity\ClinicDistributorProducts;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ClinicDistributorClinics>
 *
 * @method ClinicDistributorClinics|null find($id, $lockMode = null, $lockVersion = null)
 * @method ClinicDistributorClinics|null findOneBy(array $criteria, array $orderBy = null)
 * @method ClinicDistributorClinics[]    findAll()
 * @method ClinicDistributorClinics[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ClinicDistributorProductsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ClinicDistributorClinics::class);
    }

    public function add(ClinicDistributorClinics $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(ClinicDistributorClinics $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

//    /**
//     * @return ClinicDistributorClinics[] Returns an array of ClinicDistributorClinics objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('c')
//            ->andWhere('c.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('c.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?ClinicDistributorClinics
//    {
//        return $this->createQueryBuilder('c')
//            ->andWhere('c.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
