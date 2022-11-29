<?php

namespace App\Entity;

use App\Repository\ClinicDistributorProductsRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass=ClinicDistributorProductsRepository::class)
 */
class ClinicDistributorProducts
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity=Clinics::class, inversedBy="clinicDistributorClinics")
     */
    private $clinic;

    /**
     * @ORM\ManyToOne(targetEntity=Products::class, inversedBy="clinicDistributorClinics")
     */
    private $product;

    /**
     * @ORM\Column(type="integer")
     */
    private $itemId;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $sku;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     */
    private $distributorNo;

    /**
     * @ORM\Column(type="float")
     */
    private $unitPrice;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $stockCount;

    /**
     * @ORM\Column(type="integer")
     */
    private $isActive;

    public function __construct()
    {
        $this->setModified(new \DateTime());
        if ($this->getCreated() == null) {
            $this->setCreated(new \DateTime());
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getClinic(): ?Clinics
    {
        return $this->clinic;
    }

    public function setClinic(?Clinics $clinic): self
    {
        $this->clinic = $clinic;

        return $this;
    }

    public function getProduct(): ?Products
    {
        return $this->product;
    }

    public function setProduct(?Products $product): self
    {
        $this->product = $product;

        return $this;
    }

    public function getItemId(): ?int
    {
        return $this->itemId;
    }

    public function setItemId(int $itemId): self
    {
        $this->itemId = $itemId;

        return $this;
    }

    public function getSku(): ?string
    {
        return $this->sku;
    }

    public function setSku(?string $sku): self
    {
        $this->sku = $sku;

        return $this;
    }

    public function getDistributorNo(): ?string
    {
        return $this->distributorNo;
    }

    public function setDistributorNo(?string $distributorNo): self
    {
        $this->distributorNo = $distributorNo;

        return $this;
    }

    public function getUnitPrice(): ?float
    {
        return $this->unitPrice;
    }

    public function setUnitPrice(float $unitPrice): self
    {
        $this->unitPrice = $unitPrice;

        return $this;
    }

    public function getStockCount(): ?string
    {
        return $this->stockCount;
    }

    public function setStockCount(string $stockCount): self
    {
        $this->stockCount = $stockCount;

        return $this;
    }

    public function getIsActive(): ?int
    {
        return $this->isActive;
    }

    public function setIsActive(int $isActive): self
    {
        $this->isActive = $isActive;

        return $this;
    }
}
